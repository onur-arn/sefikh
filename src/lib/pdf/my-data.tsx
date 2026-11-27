import "server-only";
import { Text, View } from "@react-pdf/renderer";
import type { Translator } from "@/i18n/config";
import type { DataSection } from "@/lib/my-data";
import { C, Sheet, clean, s } from "./kit";

/** « Mes données » en PDF « vrai texte », au gabarit des factures et devis. */
export function MyDataPdf({ tr, sections, billing }: { tr: Translator; sections: DataSection[]; billing: (readonly [string, string])[] }) {
  const today = tr.date(new Date(), { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    <Sheet title={tr("My data")} subtitle={today} footer={tr("Summary of the personal data SEFIKH keeps about you, as of {date}.", { date: today })}>
      {sections.map((sec) => (
        <View key={sec.title}>
          <Text style={s.h2}>{tr(sec.title)}</Text>
          {sec.rows.map(([k, v]) => (
            <View key={k} style={s.tr} wrap={false}>
              <Text style={{ width: 150, color: C.muted }}>{clean(k)}</Text>
              <Text style={{ flex: 1 }}>{clean(v)}</Text>
            </View>
          ))}
        </View>
      ))}
      {billing.length > 0 && (
        <View>
          <Text style={s.h2}>{tr("Subscriptions & payments")}</Text>
          {billing.map(([label, detail], i) => (
            <View key={i} style={[s.tr, { justifyContent: "space-between" }]} wrap={false}>
              <Text style={{ flex: 1, paddingRight: 8 }}>{clean(label)}</Text>
              <Text style={{ color: C.muted }}>{clean(detail)}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={[s.small, { marginTop: 14 }]}>
        {clean(tr("Your messages, documents and pictures stay available in your dashboard. To exercise your rights (correction, deletion), write to contact@sefikh.com."))}
      </Text>
    </Sheet>
  );
}
