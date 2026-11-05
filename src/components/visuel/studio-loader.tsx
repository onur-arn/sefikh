"use client";

import dynamic from "next/dynamic";

// Le réglage en cours vit dans le navigateur (lien, brouillon) : pas de rendu serveur.
export const StudioLoader = dynamic(() => import("./studio").then((m) => m.Studio), {
  ssr: false,
  loading: () => <div className="v-boot">SEFIKH</div>,
});
