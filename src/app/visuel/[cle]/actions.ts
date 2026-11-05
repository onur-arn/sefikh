"use server";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { normalizeTheme } from "@/lib/visuel/theme";

/** Enregistre un choix. Chaque validation crée une ligne : la plus récente fait foi, les précédentes restent en historique. */
export async function saveDesignChoice(key: string, input: { clientName: string; comment: string; theme: unknown }) {
  if (!env.visuelKey || key !== env.visuelKey) return { ok: false as const, error: "Ce lien n'est plus valide." };
  const theme = normalizeTheme(input.theme);
  const clientName = input.clientName.trim().slice(0, 120);
  if (!theme) return { ok: false as const, error: "Ce réglage n'a pas pu être lu. Rechargez la page puis réessayez." };
  if (!clientName) return { ok: false as const, error: "Indiquez votre nom pour valider." };
  const choice = await db.designChoice.create({
    data: { clientName, comment: input.comment.trim().slice(0, 4000) || null, theme: JSON.stringify(theme) },
  });
  return { ok: true as const, date: choice.createdAt.toISOString() };
}
