// Préchargement du modèle CLIP au démarrage du serveur (évite la latence de la 1re recherche visuelle).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.CLIP_MODE !== "off") {
    const { warmUpClip } = await import("@/lib/clip");
    warmUpClip().catch(() => {});
  }
}
