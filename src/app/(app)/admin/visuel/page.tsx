import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { COLOR_ROLES, DETAIL_OPTIONS, encodeTheme, fontById, normalizeTheme, themeName, themeSpec } from "@/lib/visuel/theme";

const dateFr = (d: Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(d);

/** Les validations de l'interface /visuel : la plus récente fait foi. */
export default async function AdminVisuelPage() {
  const rows = await db.designChoice.findMany({ orderBy: { createdAt: "desc" } });
  const choices = rows.flatMap((row) => {
    const theme = normalizeTheme(JSON.parse(row.theme));
    return theme ? [{ ...row, theme }] : [];
  });
  const link = env.visuelKey ? `/visuel/${env.visuelKey}` : null;

  return (
    <div>
      <h1 className="display text-4xl">Choix du visuel</h1>
      {link ? (
        <p className="mt-3 text-[14px] text-ink-soft">Lien à envoyer : <a href={link} className="underline">{env.appUrl}{link}</a></p>
      ) : (
        <p className="mt-3 text-[14px] text-danger">VISUEL_KEY n&apos;est pas configurée : l&apos;interface est inaccessible.</p>
      )}

      {choices.length === 0 && <p className="mt-8 text-[14px] text-muted">Aucun choix validé pour le moment.</p>}

      <ol className="mt-8 space-y-10">
        {choices.map((c, i) => (
          <li key={c.id} className="border-t border-ink/70 pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="display text-3xl">{themeName(c.theme)}</h2>
              <p className="folio">{i === 0 ? "Choix en vigueur · " : "Historique · "}{c.clientName} · {dateFr(c.createdAt)}</p>
            </div>
            {c.comment && <p className="mt-3 max-w-2xl whitespace-pre-wrap text-[14px] text-ink-soft">« {c.comment} »</p>}
            <div className="mt-5 grid gap-8 lg:grid-cols-2">
              <div>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_ROLES.map((r) => (
                    <div key={r.key}>
                      <div className="h-14 border border-line" style={{ background: c.theme.colors[r.key] }} />
                      <p className="mt-1.5 text-[12px]">{r.label}</p>
                      <p className="folio">{c.theme.colors[r.key]}</p>
                    </div>
                  ))}
                </div>
                <dl className="mt-5 text-[13px]">
                  {[
                    ["Titres", fontById(c.theme.fonts.display)?.name],
                    ["Texte", fontById(c.theme.fonts.text)?.name],
                    ["Légendes", fontById(c.theme.fonts.caption)?.name],
                    ...DETAIL_OPTIONS.map((o) => [o.label, o.options.find((x) => x.value === c.theme.details[o.key])?.label]),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-t border-line py-1.5">
                      <dt className="text-muted">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                {link && <a href={`${link}#t=${encodeTheme(c.theme)}`} className="mt-4 inline-block text-[13px] underline">Rouvrir ce réglage dans l&apos;interface</a>}
              </div>
              <pre className="max-h-[28rem] overflow-auto border border-line bg-paper p-4 font-mono text-[11.5px] leading-relaxed">{themeSpec(c.theme)}</pre>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
