// Domaines d'expertise (v2, liste de la cliente du 24/11/2026). Un artisan peut cocher plusieurs domaines
// et plusieurs spécialités dans chacun. Stockés comme Tag (kind AREA / SPECIALTY) pour la recherche.

export type Area = {
  name: string; // nom affiché (clé de traduction) et nom du Tag AREA
  copy: string; // ligne de description de l'index
  specialties: string[]; // noms des Tag SPECIALTY
  synonyms: string[]; // mots qui déclenchent le domaine dans une recherche libre
  legacy: string[]; // anciens tags (compétences / matériaux) qui rattachent un profil existant à ce domaine
};

export const AREAS: Area[] = [
  {
    name: "Metal & Brass",
    copy: "Patinated brass, bronze casting, forged steel",
    specialties: ["Patinated brass", "Bronze casting", "Forged steel", "Metal cladding", "Ironwork"],
    synonyms: ["metal", "metalwork", "brass", "bronze", "laiton", "ferronnerie", "métallerie", "steel", "acier", "copper", "cuivre"],
    legacy: ["Metalwork", "Brass", "Bronze", "Copper", "Steel", "Casting", "Patination", "Forging"],
  },
  {
    name: "Cabinetmaking",
    copy: "Burl veneers, fine joinery, bespoke furniture",
    specialties: ["Burl veneers", "Fine joinery", "Bespoke furniture", "Marquetry", "Wall panelling"],
    synonyms: ["cabinetmaker", "cabinet maker", "ébénisterie", "ebenisterie", "joinery", "menuiserie", "furniture", "wood", "bois"],
    legacy: ["Cabinetmaking", "Woodworking", "Marquetry", "Solid wood", "Veneering"],
  },
  {
    name: "Leather & Saddlery",
    copy: "Leather wall panels, tufting, bespoke leatherwork, saddlery",
    specialties: ["Leather wall panels", "Tufting", "Bespoke leatherwork", "Saddlery"],
    synonyms: ["leather", "cuir", "sellerie", "saddlery", "maroquinerie"],
    legacy: ["Leatherwork", "Leather", "Tufting"],
  },
  {
    name: "Stone & Marble",
    copy: "Onyx, travertine, carved marble",
    specialties: ["Onyx", "Travertine", "Carved marble", "Stone cladding", "Terrazzo"],
    synonyms: ["stone", "pierre", "marble", "marbre", "marbrerie", "onyx", "travertine", "travertin"],
    legacy: ["Stone carving", "Marble", "Natural stone"],
  },
  {
    name: "Upholstery",
    copy: "Velvet, bouclé, bespoke seating",
    specialties: ["Velvet", "Bouclé", "Bespoke seating", "Headboards", "Wall upholstery"],
    synonyms: ["upholstery", "upholsterer", "tapissier", "tapisserie", "sofa", "seating"],
    legacy: ["Upholstery"],
  },
  {
    name: "Ceramics & Tiles",
    copy: "Zellige, glazed tiles, terracotta",
    specialties: ["Zellige", "Glazed tiles", "Terracotta", "Studio ceramics"],
    synonyms: ["ceramic", "ceramics", "céramique", "tiles", "carrelage", "zellige", "terracotta", "pottery"],
    legacy: ["Ceramics", "Ceramic"],
  },
  {
    name: "Textiles & Weaving",
    copy: "Handwoven fabrics, embroidery, bespoke textiles",
    specialties: ["Handwoven fabrics", "Embroidery", "Bespoke textiles", "Rugs & carpets"],
    synonyms: ["textile", "textiles", "weaving", "tissage", "embroidery", "broderie", "rug", "tapis", "fabric"],
    legacy: ["Textile design", "Textiles"],
  },
  {
    name: "Glasswork",
    copy: "Blown glass, stained glass, bespoke glass panels",
    specialties: ["Blown glass", "Stained glass", "Bespoke glass panels", "Mirrors"],
    synonyms: ["glass", "verre", "verrerie", "vitrail", "stained glass", "blown glass"],
    legacy: ["Glassmaking", "Glass"],
  },
  {
    name: "Decorative Finishes",
    copy: "Tadelakt, lime plaster, textured walls, decorative painting",
    specialties: ["Tadelakt", "Lime plaster", "Textured walls", "Decorative painting", "Gilding"],
    synonyms: ["tadelakt", "plaster", "enduit", "chaux", "lime", "decorative painting", "peinture décorative", "gilding", "dorure", "lacquer"],
    legacy: ["Gilding", "Lacquer", "Lacquering"],
  },
];

export const AREA_NAMES = AREAS.map((a) => a.name);
export const SPECIALTY_NAMES = AREAS.flatMap((a) => a.specialties);

export function areaOf(specialty: string) {
  return AREAS.find((a) => a.specialties.includes(specialty));
}

/** Domaines déduits des anciens tags d'un profil (profils créés avant la v2). */
export function legacyAreas(tagNames: string[]) {
  return AREAS.filter((a) => a.legacy.some((l) => tagNames.includes(l))).map((a) => a.name);
}
