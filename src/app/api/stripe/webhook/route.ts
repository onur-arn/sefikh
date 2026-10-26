import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getStripe, handleStripeEvent } from "@/lib/billing";

/** Webhook Stripe (signature vérifiée). En local : `npm run stripe:listen`. */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !env.stripeWebhookSecret) return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const payload = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
  } catch (e) {
    console.warn("[stripe] signature invalide", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    await handleStripeEvent(event);
  } catch (e) {
    console.error("[stripe] échec du traitement", event.type, e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 }); // Stripe réessaiera
  }
  return NextResponse.json({ received: true });
}
