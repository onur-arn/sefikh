"use client";

import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import type { RealtimeEvent, WireMessage } from "@/lib/realtime";

// Connexion temps réel unique par onglet (EventSource sur /api/realtime), utilisée par la messagerie.
// Sur Vercel, une connexion ouverte est facturée tout le temps qu'elle dure : on la ferme dès que l'onglet est caché
// ou que l'utilisateur est inactif, et on la rouvre (avec resynchronisation) à son retour.

export type ClientMessage = Omit<WireMessage, "createdAt"> & { createdAt: string; nonce?: string };
export type ClientRealtimeEvent =
  | Exclude<RealtimeEvent, { type: "message" }>
  | { type: "message"; conversationId: string; message: ClientMessage }
  | { type: "reconnected" }; // reconnexion après une coupure : resynchroniser ce qui a pu être manqué

type Handler = (event: ClientRealtimeEvent) => void;

const handlers = new Set<Handler>();
const statusListeners = new Set<() => void>();
let source: EventSource | null = null;
let connected = false;
let everConnected = false;
let retryDelay = 5_000;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let pauseTimer: ReturnType<typeof setTimeout> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let paused = false;
let watching = false;

const HIDDEN_GRACE_MS = 15_000; // onglet caché : fermeture après ce délai
const IDLE_MS = 10 * 60_000; // aucune activité (souris, clavier, toucher, défilement) : fermeture
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"] as const;

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  statusListeners.forEach((fn) => fn());
}

function emit(event: ClientRealtimeEvent) {
  handlers.forEach((fn) => fn(event));
}

function close() {
  source?.close();
  source = null;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  setConnected(false);
}

function pause() {
  if (paused) return;
  paused = true;
  close();
}

function resume() {
  if (!paused) return;
  paused = false;
  if (handlers.size) open();
}

function armIdle() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(pause, IDLE_MS);
}

let lastActivity = 0;
function onActivity() {
  const now = Date.now();
  if (now - lastActivity < 5_000 && !paused) return; // limite le travail sur pointermove / scroll
  lastActivity = now;
  armIdle();
  if (!document.hidden) resume();
}

function onVisibility() {
  if (pauseTimer) clearTimeout(pauseTimer);
  pauseTimer = null;
  if (document.hidden) pauseTimer = setTimeout(pause, HIDDEN_GRACE_MS);
  else onActivity();
}

function startWatching() {
  if (watching || typeof document === "undefined") return;
  watching = true;
  document.addEventListener("visibilitychange", onVisibility);
  ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
  armIdle();
  if (document.hidden) onVisibility();
}

function stopWatching() {
  if (!watching) return;
  watching = false;
  document.removeEventListener("visibilitychange", onVisibility);
  ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
  if (pauseTimer) clearTimeout(pauseTimer);
  if (idleTimer) clearTimeout(idleTimer);
  pauseTimer = idleTimer = null;
  paused = false;
}

function open() {
  if (paused || source || retryTimer || typeof EventSource === "undefined") return;
  const es = new EventSource("/api/realtime");
  source = es;
  es.onopen = () => {
    retryDelay = 5_000;
    setConnected(true);
    if (everConnected) emit({ type: "reconnected" });
    everConnected = true;
  };
  es.onmessage = (m) => {
    try {
      emit(JSON.parse(m.data) as ClientRealtimeEvent);
    } catch {
      // événement mal formé : ignoré
    }
  };
  // Session révoquée ou expirée : on n'insiste pas.
  es.addEventListener("unauthorized", () => {
    es.close();
    source = null;
    setConnected(false);
  });
  es.onerror = () => {
    setConnected(false);
    // Coupure réseau : EventSource se reconnecte seul. Réponse en erreur (CLOSED) : nouvel essai espacé.
    if (es.readyState === EventSource.CLOSED) {
      source = null;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (handlers.size && !paused) open();
      }, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 60_000);
    }
  };
}

function subscribe(fn: Handler) {
  handlers.add(fn);
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = null;
  startWatching();
  open();
  return () => {
    handlers.delete(fn);
    if (handlers.size) return;
    // Fermeture différée : évite de couper / rouvrir la connexion lors d'un simple remontage de composant.
    closeTimer = setTimeout(() => {
      if (handlers.size) return;
      close();
      stopWatching();
    }, 2_000);
  };
}

/** Abonne le composant aux événements temps réel de l'utilisateur connecté. */
export function useRealtime(handler: Handler, enabled = true) {
  const onEvent = useEffectEvent(handler);
  useEffect(() => {
    if (!enabled) return;
    return subscribe((event) => onEvent(event));
  }, [enabled]);
}

/** true tant que la connexion temps réel est active (sinon les composants repassent en interrogation périodique, onglet visible uniquement). */
export function useRealtimeConnected() {
  return useSyncExternalStore(
    (fn) => {
      statusListeners.add(fn);
      return () => statusListeners.delete(fn);
    },
    () => connected,
    () => false,
  );
}

export function isRealtimeConnected() {
  return connected;
}
