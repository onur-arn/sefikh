import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ai, aiEnabled, aiRequest } from "@/lib/ai";
import { canSeeMakers } from "@/lib/access";
import { getPlan } from "@/lib/plans";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logSearch, runSearch, searchesUsed, type SearchResult } from "@/lib/search";
import { visitorId } from "@/lib/visitor";
import { LOCALE_LABELS } from "@/i18n/config";
import { getT } from "@/i18n/server";

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) })).min(1).max(16),
});

const SYSTEM = `You are the SEFIKH assistant. SEFIKH connects architects, designers and hoteliers with artisans, workshops and manufacturers.
Help the user turn an idea into a clear brief and find the right makers.
- Use search_makers as soon as you know what is needed. Ask one short question only if the need is too vague to search.
- Only mention makers returned by search_makers. Never invent a maker, price, lead time or availability.
- Results appear as cards under your answer: do not list every detail. Say briefly why the best matches fit.
- Stay on interior projects, craftsmanship, materials and the use of SEFIKH. Decline anything else politely.
- Keep answers to a few short sentences, in plain text without markdown.`;

const SEARCH_TOOL: Anthropic.Beta.BetaTool = {
  name: "search_makers",
  description: "Search the SEFIKH directory. Returns the published makers that best match a need, ordered by relevance.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "The need in a few words, in English: craft, material, technique, type of project." },
      near: { type: ["string", "null"], description: "City or country when the user gave one, otherwise null." },
    },
    required: ["query", "near"],
    additionalProperties: false,
  },
};

type Card = { slug: string; name: string; anonymous: boolean; kind: string; city: string | null; country: string | null; image: string | null };

const toCard = (r: SearchResult, access: boolean): Card => ({
  slug: access ? r.slug : "",
  name: access ? r.name : "",
  anonymous: !access,
  kind: r.kind,
  city: r.city,
  country: r.country,
  image: r.image?.key ?? null,
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { messages } = parsed.data;
  if (messages.at(-1)!.role !== "user") return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const user = await getCurrentUser();
  const vid = await visitorId();
  const key = user?.id ?? vid ?? (await clientIp());
  if (!rateLimit(`assistant:${key}`, 30, 60 * 60_000).ok) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const who = { userId: user?.id ?? null, visitorId: vid };
  const limit = getPlan(user?.plan ?? "CLIENT_FREE").limits.freeSearches;
  const access = canSeeMakers(user);
  const tr = await getT();

  /** Une recherche de l'assistant compte comme une recherche texte (mêmes quotas que la page de recherche). */
  async function search(query: string, near: string | null): Promise<SearchResult[] | "limit"> {
    if (Number.isFinite(limit) && (await searchesUsed(who)) >= limit) return "limit";
    const { results } = await runSearch({ q: query, near: near ?? undefined });
    await logSearch({ userId: user?.id, visitorId: vid, mode: "TEXT", query, terms: [], results }).catch(() => {});
    return results.slice(0, 4);
  }

  const limitReply = { reply: tr("You've used your free searches"), makers: [], upgrade: true };

  // Sans clé d'API : recherche directe, sans dialogue.
  if (!aiEnabled()) {
    const found = await search(messages.at(-1)!.content, null);
    if (found === "limit") return NextResponse.json(limitReply);
    return NextResponse.json({
      reply: found.length ? tr("Here are the makers closest to your request.") : tr("I couldn't find a maker for this request. Try describing the craft or the material."),
      makers: found.map((r) => toCard(r, access)),
    });
  }

  const history: Anthropic.Beta.BetaMessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));
  const system = `${SYSTEM}\nAlways answer in ${LOCALE_LABELS[tr.locale]}.${access ? "" : "\nThis user is on the free plan: makers are anonymous. Describe them by craft and city, and explain that a Pro plan reveals names and allows contact."}`;
  const cards = new Map<string, Card>();

  try {
    for (let round = 0; round < 4; round++) {
      const response = await ai().beta.messages.create({
        ...aiRequest(),
        max_tokens: 4000,
        output_config: { effort: "low" },
        system,
        tools: [SEARCH_TOOL],
        messages: history,
      });
      if (response.stop_reason === "refusal") return NextResponse.json({ reply: tr("I can only help with interior projects and makers on SEFIKH."), makers: [] });

      const calls = response.content.filter((b) => b.type === "tool_use");
      if (response.stop_reason !== "tool_use" || !calls.length) {
        const reply = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
        return NextResponse.json({ reply, makers: [...cards.values()].slice(0, 4) });
      }

      history.push({ role: "assistant", content: response.content });
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const call of calls) {
        const input = z.object({ query: z.string().min(1).max(300), near: z.string().max(100).nullable() }).safeParse(call.input);
        if (!input.success) {
          results.push({ type: "tool_result", tool_use_id: call.id, content: "Invalid search.", is_error: true });
          continue;
        }
        const found = await search(input.data.query, input.data.near);
        if (found === "limit") return NextResponse.json(limitReply);
        found.forEach((r) => cards.set(r.id, toCard(r, access)));
        results.push({
          type: "tool_result",
          tool_use_id: call.id,
          content: JSON.stringify(found.map((r) => ({ ...(access ? { name: r.name, tagline: r.tagline } : {}), kind: r.kind, city: r.city, country: r.country, match: r.match, reasons: r.reasons }))),
        });
      }
      history.push({ role: "user", content: results });
    }
    return NextResponse.json({ reply: tr("Here are the makers closest to your request."), makers: [...cards.values()].slice(0, 4) });
  } catch (e) {
    console.error("[assistant]", e);
    return NextResponse.json({ error: "The assistant is unavailable for now." }, { status: 503 });
  }
}
