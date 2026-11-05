"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Check, Columns2, Maximize2, Minimize2, Monitor, Smartphone, Tablet, Trash2, Undo2, X } from "lucide-react";
import { saveDesignChoice } from "@/app/visuel/[cle]/actions";
import { LOCALE_COOKIE } from "@/i18n/config";
import { PREVIEW_PAGES, FONTS, decodeTheme, defaultTheme, encodeTheme, fontById, fontUrl, normalizeTheme, themeName, type Theme } from "@/lib/visuel/theme";
import { ColorsPanel, DetailsPanel, DirectionsPanel, SpecSheet, Swatches, TypePanel } from "./panels";
import { Screen, type Device, type ScrollSync } from "./preview";

type Favorite = { id: string; name: string; theme: Theme };
type LastChoice = { theme: Theme; clientName: string; comment: string; date: string };

const STORE = "sefikh-visuel-v1";
const STEPS = ["Direction", "Couleurs", "Typographie", "Détails", "Votre choix"];
const DEVICES: { id: Device; label: string; icon: typeof Monitor }[] = [
  { id: "bureau", label: "Ordinateur", icon: Monitor },
  { id: "tablette", label: "Tablette", icon: Tablet },
  { id: "mobile", label: "Téléphone", icon: Smartphone },
];

// Le brouillon est un confort : sans stockage disponible, l'interface fonctionne quand même.
function readDraft(): { theme?: Theme; favorites?: Favorite[]; name?: string; comment?: string } {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) ?? "{}");
    const favorites = Array.isArray(raw.favorites)
      ? raw.favorites.flatMap((f: Favorite) => {
          const theme = normalizeTheme(f?.theme);
          return theme ? [{ id: String(f.id), name: String(f.name), theme }] : [];
        })
      : [];
    return { theme: normalizeTheme(raw.theme) ?? undefined, favorites, name: String(raw.name ?? ""), comment: String(raw.comment ?? "") };
  } catch {
    return {};
  }
}

const dateFr = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(iso));

export function Studio({ accessKey, lastChoice }: { accessKey: string; lastChoice: LastChoice | null }) {
  const [draft] = useState(readDraft);
  const [theme, setTheme] = useState<Theme>(() => {
    const fromLink = decodeTheme(window.location.hash.replace(/^#t=/, ""));
    return fromLink ?? draft.theme ?? lastChoice?.theme ?? defaultTheme();
  });
  const [history, setHistory] = useState<Theme[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>(draft.favorites ?? []);
  const [step, setStep] = useState(0);
  const [path, setPath] = useState("/");
  const [device, setDevice] = useState<Device>(() => (window.innerWidth < 960 ? "plein" : "bureau"));
  const [compareId, setCompareId] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [name, setName] = useState(draft.name || lastChoice?.clientName || "");
  const [comment, setComment] = useState(draft.comment ?? "");
  const [saved, setSaved] = useState<{ date: string } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const sync = useRef<ScrollSync>({ frames: new Set(), leader: null });
  const body = useRef<HTMLDivElement>(null);

  // Les aperçus sont en français, quelle que soit la langue du navigateur.
  const [localeSet] = useState(() => {
    if (!document.cookie.includes(`${LOCALE_COOKIE}=`)) document.cookie = `${LOCALE_COOKIE}=fr; path=/; max-age=31536000; samesite=lax`;
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ theme, favorites, name, comment }));
    } catch {
      /* navigation privée */
    }
  }, [theme, favorites, name, comment]);

  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [step]);

  const update = (next: Theme) => {
    setHistory((h) => [...h.slice(-49), theme]);
    setTheme(next);
    setSaved(null);
  };
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((h) => h.slice(0, -1));
    setTheme(previous);
    setSaved(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const keep = () => {
    if (favorites.some((f) => encodeTheme(f.theme) === encodeTheme(theme))) return;
    const base = themeName(theme);
    const same = favorites.filter((f) => f.name.startsWith(base)).length;
    setFavorites((list) => [...list, { id: crypto.randomUUID(), name: same ? `${base} ${same + 1}` : base, theme }]);
  };
  const isKept = useMemo(() => favorites.some((f) => encodeTheme(f.theme) === encodeTheme(theme)), [favorites, theme]);

  // Sur l'accueil, la photo d'ouverture cache les couleurs : on descend jusqu'au contenu pour les réglages fins.
  const goTo = (next: number) => {
    setStep(next);
    if (path !== "/" || next === 0) return;
    for (const frame of sync.current.frames) {
      const win = frame.contentWindow;
      if (win && win.scrollY < 40) win.scrollTo({ top: win.innerHeight, behavior: "smooth" });
    }
  };

  const compared = favorites.find((f) => f.id === compareId) ?? null;

  const validate = () => {
    setError("");
    startTransition(async () => {
      const result = await saveDesignChoice(accessKey, { clientName: name, comment, theme }).catch(() => null);
      if (!result) return setError("Le choix n'a pas pu être enregistré. Vérifiez votre connexion puis réessayez.");
      if (!result.ok) return setError(result.error);
      setSaved({ date: result.date });
    });
  };

  return (
    <div className="v-root" data-focus={focus}>
      {FONTS.map((f) => <link key={f.id} rel="stylesheet" href={fontUrl(f)} precedence="visuel" />)}

      <main className="v-stage" aria-label="Aperçu du site">
        <div className="v-toolbar">
          <nav className="v-pages" aria-label="Page affichée">
            {PREVIEW_PAGES.map((p) => (
              <button key={p.path} type="button" aria-current={path === p.path} onClick={() => setPath(p.path)}>{p.label}</button>
            ))}
          </nav>
          <div className="v-tools">
            {DEVICES.map((d) => (
              <button key={d.id} type="button" className="v-icon v-only-wide" aria-pressed={device === d.id} aria-label={d.label} title={d.label} onClick={() => setDevice(d.id)}>
                <d.icon size={15} strokeWidth={1.4} />
              </button>
            ))}
            <span className="v-rule v-only-wide" />
            <button type="button" className="v-icon v-only-wide" aria-pressed={!!compared} disabled={!favorites.length} aria-label="Comparer avec un réglage mis de côté" title={favorites.length ? "Comparer avec un réglage mis de côté" : "Mettez un réglage de côté pour comparer"} onClick={() => setCompareId(compared ? null : favorites.at(-1)!.id)}>
              <Columns2 size={15} strokeWidth={1.4} />
            </button>
            <button type="button" className="v-icon v-only-wide" aria-pressed={focus} aria-label={focus ? "Afficher le panneau" : "Agrandir l'aperçu"} title={focus ? "Afficher le panneau" : "Agrandir l'aperçu"} onClick={() => setFocus(!focus)}>
              {focus ? <Minimize2 size={15} strokeWidth={1.4} /> : <Maximize2 size={15} strokeWidth={1.4} />}
            </button>
          </div>
        </div>

        {localeSet && (
          <div className="v-screens" data-compare={!!compared}>
            <figure>
              {compared && <figcaption>Réglage en cours</figcaption>}
              <Screen path={path} theme={theme} device={device} title="Aperçu du site SEFIKH" sync={sync} compact={!!compared} />
            </figure>
            {compared && (
              <figure>
                <figcaption>
                  <select value={compared.id} onChange={(e) => setCompareId(e.target.value)} aria-label="Réglage comparé">
                    {favorites.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setCompareId(null)} aria-label="Fermer la comparaison"><X size={13} strokeWidth={1.4} /></button>
                </figcaption>
                <Screen path={path} theme={compared.theme} device={device} title={`Aperçu : ${compared.name}`} sync={sync} compact />
              </figure>
            )}
          </div>
        )}
      </main>

      <aside className="v-panel" aria-label="Réglages">
        <header className="v-head">
          <div className="v-brand">
            <span>SEFIKH</span>
            <span>Choix du visuel</span>
          </div>
          <ol className="v-steps">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button type="button" aria-current={step === i ? "step" : undefined} onClick={() => goTo(i)}>
                  <span className="v-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="v-step-label">{s}</span>
                </button>
              </li>
            ))}
          </ol>
        </header>

        <div ref={body} className="v-body">
          <h2 className="v-title">{STEPS[step]}</h2>
          {step === 0 && <DirectionsPanel theme={theme} update={update} />}
          {step === 1 && <ColorsPanel theme={theme} update={update} />}
          {step === 2 && <TypePanel theme={theme} update={update} />}
          {step === 3 && <DetailsPanel theme={theme} update={update} />}
          {step === 4 && (
            <>
              <p className="v-lead">Voici le réglage affiché dans l’aperçu. Validez-le quand il vous convient : il sera transmis tel quel pour la mise en forme définitive du site.</p>

              {favorites.length > 0 && (
                <section className="v-section">
                  <header><h3>Réglages mis de côté</h3></header>
                  <ul className="v-favorites">
                    {favorites.map((f) => (
                      <li key={f.id}>
                        <button type="button" className="v-favorite" onClick={() => update(f.theme)} title="Revenir à ce réglage">
                          <Swatches colors={f.theme.colors} />
                          <span>{f.name}</span>
                        </button>
                        <button type="button" className="v-icon" aria-label={`Comparer ${f.name}`} title="Comparer" aria-pressed={compareId === f.id} onClick={() => setCompareId(compareId === f.id ? null : f.id)}><Columns2 size={14} strokeWidth={1.4} /></button>
                        <button type="button" className="v-icon" aria-label={`Retirer ${f.name}`} title="Retirer" onClick={() => { setFavorites((l) => l.filter((x) => x.id !== f.id)); if (compareId === f.id) setCompareId(null); }}><Trash2 size={14} strokeWidth={1.4} /></button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="v-section">
                <header><h3>{themeName(theme)}</h3></header>
                <SpecSheet theme={theme} />
              </section>

              {saved ? (
                <div className="v-done" role="status">
                  <Check size={18} strokeWidth={1.4} />
                  <div>
                    <strong>Votre choix est enregistré</strong>
                    <p>Reçu le {dateFr(saved.date)}. Vous pouvez encore le modifier et le valider de nouveau : la dernière version fera foi.</p>
                  </div>
                </div>
              ) : (
                <form className="v-form" onSubmit={(e) => { e.preventDefault(); validate(); }}>
                  {lastChoice && <p className="v-note">Dernier choix validé par {lastChoice.clientName}, le {dateFr(lastChoice.date)}.</p>}
                  <label>
                    <span>Votre nom</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={120} />
                  </label>
                  <label>
                    <span>Remarques <small>facultatif</small></span>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={4000} placeholder="Une nuance à ajuster, une référence, une hésitation…" />
                  </label>
                  {error && <p className="v-error" role="alert">{error}</p>}
                  <button type="submit" className="v-primary" disabled={pending}>{pending ? "Enregistrement…" : "Valider ce choix"}</button>
                </form>
              )}
            </>
          )}
        </div>

        <footer className="v-foot">
          <div className="v-current">
            <Swatches colors={theme.colors} />
            <span>
              <strong>{themeName(theme)}</strong>
              <small>{fontById(theme.fonts.display)?.name} · {fontById(theme.fonts.text)?.name}</small>
            </span>
            <button type="button" className="v-icon" disabled={!history.length} onClick={undo} aria-label="Annuler la dernière modification" title="Annuler"><Undo2 size={15} strokeWidth={1.4} /></button>
            <button type="button" className="v-icon" aria-pressed={isKept} onClick={keep} aria-label="Mettre ce réglage de côté" title="Mettre de côté pour comparer"><Bookmark size={15} strokeWidth={1.4} fill={isKept ? "currentColor" : "none"} /></button>
          </div>
          <div className="v-nav">
            <button type="button" className="v-secondary" disabled={step === 0} onClick={() => goTo(step - 1)}><ArrowLeft size={14} strokeWidth={1.4} /> Précédent</button>
            {step < STEPS.length - 1 && <button type="button" className="v-next" onClick={() => goTo(step + 1)}>{STEPS[step + 1]} <ArrowRight size={14} strokeWidth={1.4} /></button>}
          </div>
        </footer>
      </aside>
    </div>
  );
}
