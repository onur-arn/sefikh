"use client";

import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import type { RealtimeEvent, WireMessage } from "@/lib/realtime";

// Connexion temps réel unique par onglet (EventSource sur /api/realtime), partagée par l'en-tête et la messagerie.

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

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  statusListeners.forEach((fn) => fn());
}

function emit(event: ClientRealtimeEvent) {
  handlers.forEach((fn) => fn(event));
}

function open() {
  if (source || retryTimer || typeof EventSource === "undefined") return;
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
        if (handlers.size) open();
      }, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 60_000);
    }
  };
}

function subscribe(fn: Handler) {
  handlers.add(fn);
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = null;
  open();
  return () => {
    handlers.delete(fn);
    if (handlers.size) return;
    // Fermeture différée : évite de couper / rouvrir la connexion lors d'un simple remontage de composant.
    closeTimer = setTimeout(() => {
      if (handlers.size) return;
      source?.close();
      source = null;
      setConnected(false);
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

/** true tant que la connexion temps réel est active (sinon les composants repassent en interrogation périodique). */
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
