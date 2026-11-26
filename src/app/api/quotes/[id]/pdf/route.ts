import { getCurrentUser } from "@/lib/auth/session";
import { getQuoteForUser } from "@/lib/quotes-server";
import { parseQuoteData, platformLegal } from "@/lib/quotes";
import { pdfResponse } from "@/lib/pdf/kit";
import { QuotePdf } from "@/lib/pdf/quote";
import { getT } from "@/i18n/server";

/** Devis en PDF « vrai texte » (net, sélectionnable), pour les deux participants de la conversation. */
export async function GET(_: Request, ctx: RouteContext<"/api/quotes/[id]/pdf">) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const found = await getQuoteForUser(me, id);
  if (!found) return new Response("Not found", { status: 404 });
  const { quote } = found;
  const tr = await getT();
  const accepted = quote.status === "ACCEPTED" && quote.respondedAt ? { name: quote.acceptedName ?? "", at: quote.respondedAt } : null;
  return pdfResponse(QuotePdf({ number: quote.number, data: parseQuoteData(quote.data), tr, platformLegal: platformLegal(), accepted }), `SEFIKH-${quote.number}.pdf`, `${tr("Quote")} ${quote.number}`);
}
