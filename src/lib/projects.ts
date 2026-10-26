import type { Project } from "@prisma/client";
import type { SearchInput } from "@/lib/search";
import { parseList } from "@/lib/utils";

const SECTOR_BY_TYPE: Record<string, string> = {
  "Hotel renovation": "Hospitality",
  "Residential project": "Residential",
  Restaurant: "Restaurant",
  Retail: "Retail",
  Office: "Office",
  Yacht: "Yacht",
};

/** Transforme un brief de projet en requête du moteur de recherche. */
export function projectQuery(p: Project): SearchInput {
  const text = [p.description, p.style, p.lookingFor, p.productionType, ...parseList(p.materials), ...parseList(p.spaceTypes), p.colorsFinishes].filter(Boolean).join(". ");
  const sector = p.projectType ? SECTOR_BY_TYPE[p.projectType] : undefined;
  return {
    q: `${text}${sector ? `. ${sector}` : ""}`.slice(0, 500) || p.title,
    near: p.reach === "Local" || p.reach === "National" ? p.city ?? p.country ?? undefined : p.city ?? undefined,
    radiusKm: p.reach === "Local" ? 200 : undefined,
  };
}
