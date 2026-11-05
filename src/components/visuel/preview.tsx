"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { buildCss, fontById, fontUrl, type Theme } from "@/lib/visuel/theme";

export type Device = "bureau" | "tablette" | "mobile" | "plein";
const SIZES: Record<Device, { w: number; h: number | null }> = {
  bureau: { w: 1440, h: null },
  tablette: { w: 834, h: 1112 },
  mobile: { w: 390, h: 844 },
  // Sur téléphone, l'aperçu occupe toute la zone disponible.
  plein: { w: 390, h: null },
};
// En comparaison, une largeur réduite garde la mise en page bureau tout en restant lisible.
const COMPARE_WIDTH = 1100;

function inject(doc: Document, theme: Theme) {
  for (const id of Object.values(theme.fonts)) {
    const font = fontById(id);
    if (!font || doc.getElementById(`visuel-font-${id}`)) continue;
    const link = doc.createElement("link");
    link.id = `visuel-font-${id}`;
    link.rel = "stylesheet";
    link.href = fontUrl(font);
    doc.head.append(link);
  }
  let style = doc.getElementById("visuel-style");
  if (!style) {
    style = doc.createElement("style");
    style.id = "visuel-style";
    doc.head.append(style);
  }
  style.textContent = buildCss(theme);
}

/** Groupe de cadres comparés : le défilement de l'un entraîne l'autre. */
export type ScrollSync = { frames: Set<HTMLIFrameElement>; leader: HTMLIFrameElement | null; timer?: ReturnType<typeof setTimeout> };

function follow(sync: ScrollSync, source: HTMLIFrameElement) {
  if (sync.leader && sync.leader !== source) return;
  sync.leader = source;
  clearTimeout(sync.timer);
  sync.timer = setTimeout(() => (sync.leader = null), 120);
  const from = source.contentDocument?.documentElement;
  if (!from) return;
  const ratio = from.scrollTop / Math.max(1, from.scrollHeight - from.clientHeight);
  for (const frame of sync.frames) {
    if (frame === source) continue;
    const to = frame.contentDocument?.documentElement;
    if (to) frame.contentWindow?.scrollTo({ top: ratio * (to.scrollHeight - to.clientHeight), behavior: "instant" });
  }
}

/** Le vrai site, dans un cadre du même domaine : on y dépose la feuille de style du thème. */
function Frame({ path, theme, title, sync }: { path: string; theme: Theme; title: string; sync: RefObject<ScrollSync> }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const latest = useRef(theme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    latest.current = theme;
    const doc = ref.current?.contentDocument;
    if (doc?.head && doc.URL !== "about:blank") inject(doc, theme);
  }, [theme]);

  // Dès que la page existe, avant ses images : évite de voir passer le visuel d'origine.
  useEffect(() => {
    const frame = ref.current!;
    const group = sync.current;
    const onScroll = () => follow(group, frame);
    let win: Window | null = null;
    const id = setInterval(() => {
      const doc = frame.contentDocument;
      if (!doc?.head || !doc.body || doc.URL === "about:blank") return;
      clearInterval(id);
      inject(doc, latest.current);
      win = frame.contentWindow;
      win?.addEventListener("scroll", onScroll, { passive: true });
      group.frames.add(frame);
      setReady(true);
    }, 40);
    return () => {
      clearInterval(id);
      win?.removeEventListener("scroll", onScroll);
      group.frames.delete(frame);
    };
  }, [sync]);

  return (
    <iframe
      ref={ref}
      src={path}
      title={title}
      className="v-frame"
      data-ready={ready}
      onLoad={() => {
        const frame = ref.current;
        if (frame?.contentDocument?.head) inject(frame.contentDocument, latest.current);
        frame?.contentWindow?.addEventListener("scroll", () => follow(sync.current, frame), { passive: true });
      }}
    />
  );
}

function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setBox({ w: entry!.contentRect.width, h: entry!.contentRect.height }));
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);
  return [ref, box] as const;
}

/** Un écran à l'échelle : le site garde sa vraie largeur, seule sa représentation est réduite. */
export function Screen({ path, theme, device, title, sync, compact }: { path: string; theme: Theme; device: Device; title: string; sync: RefObject<ScrollSync>; compact?: boolean }) {
  const [ref, box] = useBox<HTMLDivElement>();
  const size = compact && device === "bureau" ? { w: COMPARE_WIDTH, h: null } : SIZES[device];
  const scale = box.w ? Math.min(1, box.w / size.w, size.h ? box.h / size.h : 1) : 0;
  const width = size.h ? size.w : Math.max(size.w, scale ? box.w / scale : 0);
  const height = size.h ?? (scale ? box.h / scale : 0);
  return (
    <div ref={ref} className="v-screen">
      {scale > 0 && (
        <div className="v-device" data-device={device} style={{ width: width * scale, height: height * scale }}>
          <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
            <Frame key={path} path={path} theme={theme} title={title} sync={sync} />
          </div>
        </div>
      )}
    </div>
  );
}
