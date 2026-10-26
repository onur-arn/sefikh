import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { billingPortalUrl } from "@/lib/billing";

/** Portail client Stripe : moyens de paiement, factures, adresse de facturation. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = await billingPortalUrl(user).catch((e) => {
    console.error("[portal]", e);
    return null;
  });
  if (!url) return NextResponse.json({ error: "The billing portal is available once you have a paid subscription." }, { status: 400 });
  return NextResponse.json({ url });
}
