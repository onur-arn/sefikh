import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { BillingError, startCheckout } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
import type { PlanId } from "@/lib/plans";

const schema = z.object({
  plan: z.enum(["CLIENT_PRO", "CLIENT_STUDIO", "PRO_PRO", "PRO_VISIBILITY", "PRO_INTELLIGENCE", "PRO_FOUNDING"]),
  term: z.enum(["ANNUAL", "MONTHLY"]),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to subscribe.", code: "AUTH" }, { status: 401 });
  const rl = rateLimit(`checkout:${user.id}`, 10, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  try {
    const url = await startCheckout(user, parsed.data.plan as PlanId, parsed.data.term);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof BillingError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[checkout]", e);
    return NextResponse.json({ error: "Payment could not be started. Please try again." }, { status: 500 });
  }
}
