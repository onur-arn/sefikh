"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles, X } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn, fileUrl } from "@/lib/utils";

type Card = { slug: string; name: string; tagline: string | null; city: string | null; country: string | null; image: string | null; match: number };
type Turn = { role: "user" | "assistant"; content: string; makers?: Card[]; upgrade?: boolean };

/** Assistant de sourcing : transforme une idée en brief et propose des makers de l'annuaire. */
export function AssistantWidget() {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  async function send() {
    const content = draft.trim();
    if (!content || pending) return;
    const next: Turn[] = [...turns, { role: "user", content }];
    setTurns(next);
    setDraft("");
    setError(null);
    setPending(true);
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: next.slice(-16).map(({ role, content }) => ({ role, content })) }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setPending(false);
    if (!res?.ok || !data?.reply) return setError(data?.error ?? "The assistant is unavailable for now.");
    setTurns([...next, { role: "assistant", content: data.reply, makers: data.makers, upgrade: data.upgrade }]);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-[13.5px] font-medium text-ivory shadow-lg transition hover:bg-espresso">
        <Sparkles className="size-4" />
        {tr("Ask the assistant")}
      </button>
    );
  }

  return (
    <section aria-label={tr("SEFIKH assistant")} className="fixed inset-x-3 bottom-3 z-40 flex h-[min(620px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-ivory shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px]">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-brass" />
          {tr("SEFIKH assistant")}
        </p>
        <button type="button" onClick={() => setOpen(false)} aria-label={tr("Close")} className="rounded-full p-1.5 hover:bg-sand">
          <X className="size-4" />
        </button>
      </header>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {turns.length === 0 && <p className="rounded-2xl bg-paper px-4 py-3 text-sm leading-relaxed text-ink-soft">{tr("Tell me about your project: what you want to create, the material, the place. I'll find the right makers.")}</p>}
        {turns.map((t, i) => (
          <div key={i} className={cn("flex flex-col gap-2", t.role === "user" && "items-end")}>
            <p className={cn("max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed", t.role === "user" ? "bg-ink text-ivory" : "bg-paper text-ink-soft")}>{t.content}</p>
            {t.upgrade && (
              <Link href="/pricing" className="text-[13px] underline underline-offset-2">
                {tr("See plans")}
              </Link>
            )}
            {t.makers?.map((m) => (
              <Link key={m.slug} href={`/makers/${m.slug}`} className="flex items-center gap-3 rounded-xl border border-line bg-paper p-2 transition hover:border-ink/40">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-sand">{m.image && <Image src={fileUrl(m.image)!} alt="" fill sizes="56px" className="object-cover" />}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{m.name}</span>
                  <span className="block truncate text-[12px] text-muted">{[m.city, m.country].filter(Boolean).join(", ")}</span>
                </span>
              </Link>
            ))}
          </div>
        ))}
        {pending && <Loader2 className="size-4 animate-spin text-muted" aria-label={tr("Searching…")} />}
        {error && <p role="alert" className="text-sm text-danger">{tr(error)}</p>}
      </div>

      <form
        className="flex items-end gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={tr("Describe your project…")}
          aria-label={tr("Describe your project…")}
          className="field max-h-28 min-h-11 flex-1 resize-none py-2.5 text-sm"
        />
        <button type="submit" disabled={pending || !draft.trim()} aria-label={tr("Send")} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-ivory disabled:opacity-40">
          <ArrowUp className="size-4" />
        </button>
      </form>
    </section>
  );
}
