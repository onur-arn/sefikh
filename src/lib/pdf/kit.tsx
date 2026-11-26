import "server-only";
import path from "node:path";
import type { ReactNode } from "react";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

/**
 * Socle des PDF « vrai texte » (net, sélectionnable) : devis et factures, au gabarit du modèle SEFIKH.
 * Polices du site embarquées (Cormorant Garamond pour les titres, Jost pour le texte), sous-ensemble latin.
 */
const FONTS = path.join(process.cwd(), "src/assets/fonts");
let registered = false;
function registerFonts() {
  if (registered) return;
  Font.register({ family: "Jost", fonts: [{ src: path.join(FONTS, "jost-latin-400-normal.woff") }, { src: path.join(FONTS, "jost-latin-500-normal.woff"), fontWeight: 500 }] });
  Font.register({ family: "Cormorant", src: path.join(FONTS, "cormorant-garamond-latin-400-normal.woff") });
  Font.registerHyphenationCallback((word) => [word]); // pas de césure automatique
  registered = true;
}

export const C = { ink: "#111111", soft: "#373737", muted: "#757575", line: "#d9d9d9", brass: "#481c17", success: "#4c6b4f", danger: "#a33a2f" };

export const s = StyleSheet.create({
  page: { fontFamily: "Jost", fontSize: 9, color: C.ink, paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, lineHeight: 1.45 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 0.8, borderBottomColor: C.ink, paddingBottom: 12 },
  logo: { fontFamily: "Cormorant", fontSize: 22, letterSpacing: 4, lineHeight: 1.25 },
  baseline: { fontSize: 6.5, letterSpacing: 1, color: C.brass, marginTop: 3, textTransform: "uppercase" },
  docTitle: { fontFamily: "Cormorant", fontSize: 20, letterSpacing: 1.5, textAlign: "right", textTransform: "uppercase", lineHeight: 1.25 },
  docSub: { fontSize: 8.5, color: C.soft, textAlign: "right", marginTop: 2 },
  meta: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.line, paddingVertical: 8 },
  metaCell: { flex: 1, paddingRight: 8 },
  label: { fontSize: 6.5, letterSpacing: 0.6, color: C.muted, textTransform: "uppercase" },
  metaValue: { fontWeight: 500, marginTop: 2 },
  parties: { flexDirection: "row", marginTop: 14 },
  party: { flex: 1, borderTopWidth: 0.8, borderTopColor: C.ink, paddingTop: 5 },
  partyTitle: { fontSize: 6.5, letterSpacing: 0.6, color: C.brass, textTransform: "uppercase", marginBottom: 4 },
  kv: { flexDirection: "row", marginBottom: 1.5 },
  kvKey: { width: 78, color: C.muted },
  kvVal: { flex: 1 },
  h2: { fontFamily: "Cormorant", fontSize: 13, marginTop: 16, marginBottom: 5, lineHeight: 1.25 },
  th: { flexDirection: "row", borderBottomWidth: 0.8, borderBottomColor: C.ink, paddingBottom: 3 },
  thText: { fontSize: 6.5, letterSpacing: 0.5, color: C.muted, textTransform: "uppercase" },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.line, paddingVertical: 4 },
  num: { textAlign: "right" },
  ref: { color: C.muted, fontSize: 8 },
  small: { fontSize: 8, color: C.soft },
  footer: { position: "absolute", bottom: 22, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: C.line, paddingTop: 5, fontSize: 6.5, letterSpacing: 0.5, color: C.muted, textAlign: "center", textTransform: "uppercase" },
});

/** Les espaces insécables fines (U+202F, montants en français) n'existent pas dans le sous-ensemble de police. */
export const clean = (v: string) => v.replace(/ /g, " ");

export function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.kv}>
      <Text style={s.kvKey}>{k} :</Text>
      <Text style={s.kvVal}>{v ? clean(v) : "—"}</Text>
    </View>
  );
}

export function Meta({ items }: { items: [string, string][] }) {
  return (
    <View style={s.meta}>
      {items.map(([k, v]) => (
        <View key={k} style={s.metaCell}>
          <Text style={s.label}>{k}</Text>
          <Text style={s.metaValue}>{clean(v)}</Text>
        </View>
      ))}
    </View>
  );
}

export function Party({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <View style={s.party} wrap={false}>
      <Text style={s.partyTitle}>{title}</Text>
      {rows.map(([k, v]) => (
        <KV key={k} k={k} v={v} />
      ))}
    </View>
  );
}

/** Tableau simple : colonnes en proportions (`flex`), alignement à droite pour les montants. */
export function Table({ cols, rows }: { cols: { label: string; flex: number; right?: boolean }[]; rows: (string | ReactNode)[][] }) {
  return (
    <View>
      <View style={s.th}>
        {cols.map((c, j) => (
          <Text key={c.label} style={[s.thText, { flex: c.flex, paddingRight: j < cols.length - 1 ? 6 : 0 }, c.right ? s.num : {}]}>
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={s.tr} wrap={false}>
          {r.map((cell, j) => (
            <View key={j} style={{ flex: cols[j]!.flex, paddingRight: j < cols.length - 1 ? 6 : 0 }}>
              {typeof cell === "string" ? <Text style={cols[j]!.right ? s.num : j === 0 ? s.ref : {}}>{clean(cell)}</Text> : cell}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function Totals({ rows, total }: { rows: { label: string; value: string; strong?: boolean }[]; total: { label: string; value: string } }) {
  return (
    <View style={{ marginLeft: "auto", width: 230 }} wrap={false}>
      {rows.map((r) => (
        <View key={r.label} style={[{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }, r.strong ? { borderTopWidth: 0.8, borderTopColor: C.ink, paddingTop: 4 } : {}]}>
          <Text style={r.strong ? { fontWeight: 500 } : { color: C.soft }}>{clean(r.label)}</Text>
          <Text style={r.strong ? { fontWeight: 500 } : {}}>{clean(r.value)}</Text>
        </View>
      ))}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 1.6, borderTopColor: C.ink, marginTop: 3, paddingTop: 5 }}>
        <Text style={{ fontSize: 7.5, letterSpacing: 0.6, textTransform: "uppercase" }}>{total.label}</Text>
        <Text style={{ fontFamily: "Cormorant", fontSize: 16, color: C.brass, lineHeight: 1.2 }}>{clean(total.value)}</Text>
      </View>
    </View>
  );
}

export function Sheet({ title, subtitle, footer, children }: { title: string; subtitle: string; footer: string; children: ReactNode }) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <View>
          <Text style={s.logo}>SEFIKH</Text>
          <Text style={s.baseline}>Search Engine For Interior Know-How</Text>
        </View>
        <View>
          <Text style={s.docTitle}>{title}</Text>
          <Text style={s.docSub}>{subtitle}</Text>
        </View>
      </View>
      {children}
      <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => `${clean(footer)} · ${pageNumber} / ${totalPages}`} />
    </Page>
  );
}

export async function pdfResponse(doc: ReactNode, filename: string, title: string) {
  registerFonts();
  const buf = await renderToBuffer(<Document title={title} author="SEFIKH" creator="SEFIKH" producer="SEFIKH">{doc}</Document>);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\w.\-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
