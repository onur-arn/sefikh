import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

/** Export RGPD des données personnelles (droit à la portabilité). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, email: true, name: true, role: true, plan: true, createdAt: true, emailVerifiedAt: true, notifyByEmail: true,
      clientProfile: true,
      company: { include: { tags: { include: { tag: true } }, portfolio: { select: { title: true, description: true, projectName: true, location: true, year: true, key: true, createdAt: true } } } },
      projects: true,
      documents: { select: { name: true, mime: true, size: true, createdAt: true } },
      messages: { select: { body: true, createdAt: true, conversationId: true } },
      savedCompanies: { select: { companyId: true, createdAt: true } },
      subscriptions: { select: { plan: true, term: true, status: true, amount: true, createdAt: true, currentPeriodEnd: true } },
      payments: { select: { amount: true, currency: true, status: true, description: true, createdAt: true } },
      searches: { select: { mode: true, query: true, createdAt: true } },
    },
  });
  return new NextResponse(JSON.stringify({ exportedAt: new Date(), ...data }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="sefikh-data-${new Date().toISOString().slice(0, 10)}.json"` },
  });
}
