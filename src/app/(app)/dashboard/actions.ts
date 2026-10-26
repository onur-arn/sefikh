"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { MATERIALS, SECTORS, SKILLS, TECHNIQUES } from "@/lib/constants";
import { continentOf, findCountry, geocode } from "@/lib/geo";
import { slugify, toList } from "@/lib/utils";
import { fieldErrors, formToObject, type FormState } from "@/lib/validation";

const opt = (max = 200) => z.string().trim().max(max).optional().transform((v) => v || null);
const vocab = (list: { name: string }[]) => z.array(z.string()).transform((arr) => arr.filter((v) => list.some((x) => x.name === v)));

// ───────────────────────── Profil créatif ─────────────────────────

const clientSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  studioName: opt(120),
  clientType: opt(40),
  sector: opt(120),
  phone: opt(40),
  street: opt(),
  street2: opt(),
  city: opt(100),
  region: opt(100),
  country: opt(100),
  website: z.string().trim().max(200).optional().transform((v) => (v ? (/^https?:\/\//.test(v) ? v : `https://${v}`) : null)),
  bio: opt(2000),
  keywords: z.array(z.string().max(40)).max(15),
});

export async function saveClientProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = clientSchema.safeParse(formToObject(formData, ["keywords"]));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const { name, keywords, ...profile } = parsed.data;
  await db.user.update({ where: { id: user.id }, data: { name } });
  await db.clientProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...profile, keywords: toList(keywords) },
    update: { ...profile, keywords: toList(keywords) },
  });
  revalidatePath("/dashboard", "layout");
  if (formData.get("onboarding")) redirect("/dashboard?welcome=1");
  return { success: "Your profile has been saved." };
}

// ───────────────────────── Profil pro (entreprise) ─────────────────────────

const companySchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your company's name.").max(100),
    kind: z.enum(["ARTISAN", "WORKSHOP", "MANUFACTURER", "SUPPLIER", "DESIGNER"]),
    sector: opt(120),
    tagline: opt(140),
    about: opt(5000),
    publicEmail: z.union([z.literal(""), z.string().trim().email("Invalid e-mail.")]).optional().transform((v) => v || null),
    phone: opt(40),
    website: z.string().trim().max(200).optional().transform((v) => (v ? (/^https?:\/\//.test(v) ? v : `https://${v}`) : null)),
    street: opt(),
    street2: opt(),
    city: z.string().trim().min(1, "City is required.").max(100),
    region: opt(100),
    country: z.string().trim().min(1, "Country is required.").max(100),
    operationAreas: z.array(z.string()).max(20),
    skills: vocab(SKILLS),
    materials: vocab(MATERIALS),
    techniques: vocab(TECHNIQUES),
    sectors: vocab(SECTORS),
    keywords: z.array(z.string().max(40)).max(15),
    productionCapacity: opt(600),
    leadTimeMin: z.coerce.number().int().min(0).max(24).optional().catch(undefined),
    leadTimeMax: z.coerce.number().int().min(0).max(24).optional().catch(undefined),
    availability: z.array(z.coerce.number().int().min(1).max(12)),
    foundedYear: z.coerce.number().int().min(1700).max(new Date().getFullYear()).optional().catch(undefined),
    teamSize: opt(20),
    published: z.string().optional().transform((v) => v === "on"),
  })
  .refine((d) => d.skills.length + d.materials.length > 0, { message: "Select at least one skill or material.", path: ["skills"] });

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name) || "maker";
  let slug = base;
  for (let i = 2; await db.company.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined }, select: { id: true } }); i++) slug = `${base}-${i}`;
  return slug;
}

export async function saveCompanyProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "PRO") return { error: "Only maker accounts have a business profile." };
  const parsed = companySchema.safeParse(formToObject(formData, ["operationAreas", "skills", "materials", "techniques", "sectors", "keywords", "availability"]));
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const country = findCountry(d.country) ?? d.country;
  const geo = geocode(d.city, country);
  const tagNames = [
    ...d.skills.map((n) => ["SKILL", n]),
    ...d.materials.map((n) => ["MATERIAL", n]),
    ...d.techniques.map((n) => ["TECHNIQUE", n]),
    ...d.sectors.map((n) => ["SECTOR", n]),
  ] as const;
  const tags = await db.tag.findMany({ where: { OR: tagNames.map(([kind, name]) => ({ kind, name })) } });
  const [min, max] = [d.leadTimeMin, d.leadTimeMax].sort((a, b) => (a ?? 0) - (b ?? 0));

  const data = {
    name: d.name,
    kind: d.kind,
    sector: d.sector,
    tagline: d.tagline,
    about: d.about,
    publicEmail: d.publicEmail,
    phone: d.phone,
    website: d.website,
    street: d.street,
    street2: d.street2,
    city: d.city,
    region: d.region,
    country,
    continent: continentOf(country),
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    operationAreas: toList(d.operationAreas),
    keywords: toList(d.keywords),
    productionCapacity: d.productionCapacity,
    leadTimeMin: min ?? null,
    leadTimeMax: max ?? null,
    availability: JSON.stringify([...new Set(d.availability)].sort((a, b) => a - b)),
    foundedYear: d.foundedYear ?? null,
    teamSize: d.teamSize,
  };

  const existing = await db.company.findUnique({ where: { userId: user.id } });
  const portfolioCount = existing ? await db.portfolioImage.count({ where: { companyId: existing.id } }) : 0;
  // Publication possible dès qu'il y a au moins une photo (sinon le profil reste en brouillon).
  const published = d.published && portfolioCount > 0;

  if (existing) {
    await db.$transaction([
      db.companyTag.deleteMany({ where: { companyId: existing.id } }),
      db.company.update({
        where: { id: existing.id },
        data: { ...data, published, slug: existing.name !== d.name ? await uniqueSlug(d.name, existing.id) : existing.slug, tags: { create: tags.map((t) => ({ tagId: t.id })) } },
      }),
    ]);
  } else {
    await db.company.create({ data: { ...data, userId: user.id, slug: await uniqueSlug(d.name), published: false, tags: { create: tags.map((t) => ({ tagId: t.id })) } } });
  }
  revalidatePath("/dashboard", "layout");
  revalidatePath("/search");

  if (formData.get("onboarding")) redirect("/dashboard/portfolio?onboarding=1");
  if (d.published && !published) return { success: "Profile saved. Add at least one portfolio picture to publish it." };
  return { success: published ? "Profile saved and published." : "Profile saved (not published)." };
}

export async function setPublished(published: boolean) {
  const user = await getCurrentUser();
  if (!user?.company) return { error: "No business profile." };
  const count = await db.portfolioImage.count({ where: { companyId: user.company.id } });
  if (published && count === 0) return { error: "Add at least one portfolio picture before publishing." };
  await db.company.update({ where: { id: user.company.id }, data: { published } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
