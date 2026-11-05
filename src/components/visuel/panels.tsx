"use client";

import { useState, type CSSProperties } from "react";
import {
  COLOR_ROLES, DETAIL_OPTIONS, DIRECTIONS, FONTS, PALETTES, PIGMENTS,
  contrast, fontById, isDark, isHex, mix, themeFromDirection, tokens,
  type Colors, type Details, type FontRole, type Theme,
} from "@/lib/visuel/theme";

type Update = (next: Theme) => void;
const family = (id: string): CSSProperties => ({ fontFamily: `"${fontById(id)?.name}", serif` });

export function Swatches({ colors }: { colors: Colors }) {
  return (
    <span className="v-strip" aria-hidden>
      {[colors.bg, colors.surface, colors.ink, colors.accent, colors.dark].map((c, i) => (
        <span key={i} style={{ background: c }} />
      ))}
    </span>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="v-section">
      <header>
        <h3>{title}</h3>
        {hint && <p>{hint}</p>}
      </header>
      {children}
    </section>
  );
}

// ── 01 Directions ────────────────────────────────────────────

export function DirectionsPanel({ theme, update }: { theme: Theme; update: Update }) {
  return (
    <>
      <p className="v-lead">Chaque direction est un parti pris complet. Partez de celle qui vous parle, faites défiler l’aperçu du site, puis affinez chaque détail dans les étapes suivantes.</p>
      <div className="v-directions">
        {DIRECTIONS.map((d, i) => {
          const preset = themeFromDirection(d.id);
          const capitals = preset.details.titleCase === "capitales";
          return (
            <button
              key={d.id}
              type="button"
              className="v-direction"
              aria-pressed={theme.direction === d.id}
              onClick={() => update(preset)}
            >
              <span className="v-plate" style={{ background: d.colors.bg, color: d.colors.ink }}>
                <span className="v-plate-no" style={{ ...family(d.fonts.caption), color: d.colors.accent }}>N° {String(i + 1).padStart(2, "0")}</span>
                <span className="v-plate-title" style={{ ...family(d.fonts.display), textTransform: capitals ? "uppercase" : "none", fontSize: capitals ? "1.2rem" : undefined }}>
                  {d.name}
                </span>
                <span className="v-plate-band" style={{ background: d.colors.dark }}>
                  <span style={{ background: d.colors.accent }} />
                </span>
              </span>
              <span className="v-direction-note">{d.note}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── 02 Couleurs ──────────────────────────────────────────────

function Reading({ label, ratio, min }: { label: string; ratio: number; min: number }) {
  const ok = ratio >= min;
  return (
    <li className="v-reading" data-ok={ok}>
      <span>{label}</span>
      <span className="v-num">{ratio.toFixed(1)}:1</span>
      <span className="v-verdict">{ok ? "Lisible" : "Trop faible"}</span>
    </li>
  );
}

function ColorRow({ role, value, onChange }: { role: (typeof COLOR_ROLES)[number]; value: string; onChange: (hex: string) => void }) {
  // Saisie libre : le champ peut être incomplet le temps de la frappe, seul un code valide est appliqué.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="v-color">
      <label className="v-well" style={{ background: value }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${role.label} : choisir une couleur`} />
      </label>
      <span className="v-color-name">
        <strong>{role.label}</strong>
        <small>{role.hint}</small>
      </span>
      <input
        className="v-hex"
        value={draft ?? value}
        spellCheck={false}
        aria-label={`${role.label} : code hexadécimal`}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const typed = e.target.value.trim().toLowerCase();
          setDraft(typed);
          const next = typed.startsWith("#") ? typed : `#${typed}`;
          if (isHex(next)) onChange(next);
        }}
        onBlur={() => setDraft(null)}
      />
    </div>
  );
}

export function ColorsPanel({ theme, update }: { theme: Theme; update: Update }) {
  const c = theme.colors;
  const set = (colors: Colors) => update({ ...theme, direction: null, colors });
  const dark = isDark(c.bg);
  const t = tokens(c);
  return (
    <>
      <Section title="Nuancier" hint="Remplace toutes les couleurs, sans toucher aux polices.">
        <div className="v-palettes">
          {PALETTES.map((p) => {
            const on = COLOR_ROLES.every((r) => p.colors[r.key] === c[r.key]);
            return (
              <button key={p.id} type="button" className="v-palette" aria-pressed={on} onClick={() => set({ ...p.colors })}>
                <Swatches colors={p.colors} />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </Section>
      <Section title="Pigment d'accent" hint={dark ? "Éclairci automatiquement sur fond sombre." : "La seule couleur qui parle fort."}>
        <div className="v-pigments">
          {PIGMENTS.map((p) => {
            const hex = dark ? mix(p.hex, c.ink, 0.5) : p.hex;
            return (
              <button key={p.name} type="button" className="v-pigment" aria-pressed={hex === c.accent} onClick={() => set({ ...c, accent: hex })} title={p.name}>
                <span style={{ background: hex }} />
                <small>{p.name}</small>
              </button>
            );
          })}
        </div>
      </Section>
      <Section title="Réglage fin" hint="Cliquez sur une pastille, ou saisissez un code couleur.">
        {COLOR_ROLES.map((role) => (
          <ColorRow key={role.key} role={role} value={c[role.key]} onChange={(hex) => set({ ...c, [role.key]: hex })} />
        ))}
      </Section>
      <Section title="Lisibilité" hint="Contrôle automatique selon les normes d'accessibilité.">
        <ul className="v-readings">
          <Reading label="Texte sur fond" ratio={contrast(c.ink, c.bg)} min={4.5} />
          <Reading label="Légendes sur fond" ratio={contrast(t.muted, c.bg)} min={4.5} />
          <Reading label="Accent sur fond" ratio={contrast(c.accent, c.bg)} min={3} />
          <Reading label="Texte sur bandeau sombre" ratio={contrast(dark ? c.ink : c.surface, c.dark)} min={4.5} />
        </ul>
      </Section>
    </>
  );
}

// ── 03 Typographie ───────────────────────────────────────────

const TYPE_TABS = [
  { id: "accords", label: "Accords" },
  { id: "display", label: "Titres" },
  { id: "text", label: "Texte" },
  { id: "caption", label: "Légendes" },
] as const;

const SAMPLE: Record<FontRole, string> = {
  display: "Trouver les bonnes mains",
  text: "Ébénistes, ferronniers et tailleurs de pierre, réunis par savoir-faire.",
  caption: "N° 02 · Index des métiers",
};

export function TypePanel({ theme, update }: { theme: Theme; update: Update }) {
  const [tab, setTab] = useState<(typeof TYPE_TABS)[number]["id"]>("accords");
  const fonts = theme.fonts;
  return (
    <>
      <div className="v-segments" role="tablist" aria-label="Typographie">
        {TYPE_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === "accords" ? (
        <div className="v-list">
          {DIRECTIONS.map((d) => {
            const on = d.fonts.display === fonts.display && d.fonts.text === fonts.text && d.fonts.caption === fonts.caption;
            return (
              <button key={d.id} type="button" className="v-pair" aria-pressed={on} onClick={() => update({ ...theme, direction: null, fonts: { ...d.fonts } })}>
                <span className="v-pair-title" style={family(d.fonts.display)}>{SAMPLE.display}</span>
                <span className="v-pair-text" style={family(d.fonts.text)}>{SAMPLE.text}</span>
                <span className="v-pair-names">{fontById(d.fonts.display)?.name} + {fontById(d.fonts.text)?.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="v-list">
          {FONTS.filter((f) => f.roles.includes(tab)).map((f) => (
            <button key={f.id} type="button" className="v-font" data-role={tab} aria-pressed={fonts[tab] === f.id} onClick={() => update({ ...theme, direction: null, fonts: { ...fonts, [tab]: f.id } })}>
              <span className="v-font-sample" style={family(f.id)}>{SAMPLE[tab]}</span>
              <span className="v-font-name">{f.name} <small>{f.kind}</small></span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ── 04 Détails ───────────────────────────────────────────────

export function DetailsPanel({ theme, update }: { theme: Theme; update: Update }) {
  return (
    <>
      {DETAIL_OPTIONS.map((group) => (
        <Section key={group.key} title={group.label} hint={group.hint}>
          <div className="v-segments" role="radiogroup" aria-label={group.label}>
            {group.options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={theme.details[group.key] === o.value}
                onClick={() => update({ ...theme, direction: null, details: { ...theme.details, [group.key]: o.value } as Details })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}

// ── Fiche récapitulative ─────────────────────────────────────

export function SpecSheet({ theme }: { theme: Theme }) {
  const rows: [string, string][] = [
    ["Titres", fontById(theme.fonts.display)?.name ?? ""],
    ["Texte", fontById(theme.fonts.text)?.name ?? ""],
    ["Légendes", fontById(theme.fonts.caption)?.name ?? ""],
    ...DETAIL_OPTIONS.map((o): [string, string] => [o.label, o.options.find((x) => x.value === theme.details[o.key])?.label ?? ""]),
  ];
  return (
    <div className="v-spec">
      <div className="v-spec-colors">
        {COLOR_ROLES.map((r) => (
          <span key={r.key}>
            <i style={{ background: theme.colors[r.key] }} />
            <b>{r.label}</b>
            <small>{theme.colors[r.key]}</small>
          </span>
        ))}
      </div>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

