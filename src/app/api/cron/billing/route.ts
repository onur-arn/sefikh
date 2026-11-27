import { suspendUnpaid } from "@/lib/billing";

/** Cron quotidien (vercel.json) : coupe l'accès des abonnés impayés depuis plus de 7 jours. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  return Response.json({ suspended: await suspendUnpaid() });
}
