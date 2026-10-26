import "server-only";
import path from "node:path";
import { env } from "@/lib/env";

// Embeddings CLIP (ViT-B/32 quantifié, ~150 Mo) calculés localement avec transformers.js.
// Images et textes partagent le même espace vectoriel : on peut donc comparer une photo déposée
// aux photos des portfolios, ou une description de projet aux photos.

const MODEL_ID = "Xenova/clip-vit-base-patch32";

type Models = {
  processor: (img: unknown) => Promise<unknown>;
  vision: (inputs: unknown) => Promise<{ image_embeds: { data: Float32Array } }>;
  tokenizer: (texts: string[], opts: object) => unknown;
  text: (inputs: unknown) => Promise<{ text_embeds: { data: Float32Array } }>;
  RawImage: { fromBlob: (blob: Blob) => Promise<unknown> };
};

let loading: Promise<Models | null> | null = null;

async function load(): Promise<Models | null> {
  if (!env.clipEnabled) return null;
  try {
    const t = await import("@huggingface/transformers");
    t.env.cacheDir = path.resolve(process.cwd(), ".cache/models");
    const [processor, vision, tokenizer, text] = await Promise.all([
      t.AutoProcessor.from_pretrained(MODEL_ID),
      t.CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, { dtype: "q8" }),
      t.AutoTokenizer.from_pretrained(MODEL_ID),
      t.CLIPTextModelWithProjection.from_pretrained(MODEL_ID, { dtype: "q8" }),
    ]);
    return {
      processor: processor as unknown as Models["processor"],
      vision: vision as unknown as Models["vision"],
      tokenizer: tokenizer as unknown as Models["tokenizer"],
      text: text as unknown as Models["text"],
      RawImage: t.RawImage as unknown as Models["RawImage"],
    };
  } catch (e) {
    console.warn("[clip] modèle indisponible, repli sur l'empreinte couleur :", e instanceof Error ? e.message : e);
    return null;
  }
}

function getModels() {
  loading ??= load();
  return loading;
}

function normalize(v: Float32Array) {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}

export async function warmUpClip() {
  await getModels();
}

export async function embedImage(buffer: Buffer): Promise<Float32Array | null> {
  const m = await getModels();
  if (!m) return null;
  try {
    const image = await m.RawImage.fromBlob(new Blob([new Uint8Array(buffer)]));
    const { image_embeds } = await m.vision(await m.processor(image));
    return normalize(new Float32Array(image_embeds.data));
  } catch (e) {
    console.error("[clip] embedImage", e);
    return null;
  }
}

const textCache = new Map<string, Float32Array>();

export async function embedText(text: string): Promise<Float32Array | null> {
  const q = text.trim().toLowerCase().slice(0, 300);
  if (!q) return null;
  const hit = textCache.get(q);
  if (hit) return hit;
  const m = await getModels();
  if (!m) return null;
  try {
    const { text_embeds } = await m.text(m.tokenizer([`a photo of ${q}`], { padding: true, truncation: true }));
    const v = normalize(new Float32Array(text_embeds.data));
    if (textCache.size > 500) textCache.clear();
    textCache.set(q, v);
    return v;
  } catch (e) {
    console.error("[clip] embedText", e);
    return null;
  }
}
