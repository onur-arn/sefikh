import { getCurrentUser } from "@/lib/auth/session";
import { myData } from "@/lib/my-data";
import { pdfResponse } from "@/lib/pdf/kit";
import { MyDataPdf } from "@/lib/pdf/my-data";
import { getT } from "@/i18n/server";

/** « Mes données » en PDF « vrai texte » (net, sélectionnable), comme les factures. */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const tr = await getT();
  const { sections, billing } = await myData(me.id, tr);
  return pdfResponse(MyDataPdf({ tr, sections, billing }), "sefikh-mes-donnees.pdf", tr("My data"));
}
