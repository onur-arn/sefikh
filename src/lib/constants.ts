// Vocabulaire métier partagé (client + serveur).

export type TagKind = "SKILL" | "MATERIAL" | "TECHNIQUE" | "SECTOR";
export type Role = "CLIENT" | "PRO" | "ADMIN";

type Vocab = { name: string; synonyms?: string[] };

export const SKILLS: Vocab[] = [
  { name: "Cabinetmaking", synonyms: ["cabinet maker", "cabinetmaker", "ébénisterie", "ebenisterie", "joinery", "menuiserie", "furniture maker"] },
  { name: "Woodworking", synonyms: ["wood work", "woodwork", "carpentry", "charpente", "bois"] },
  { name: "Metalwork", synonyms: ["metal work", "metalsmith", "ferronnerie", "métallerie", "blacksmith", "welding"] },
  { name: "Upholstery", synonyms: ["upholsterer", "tapissier", "tapisserie", "sofa", "armchair", "seating"] },
  { name: "Glassmaking", synonyms: ["glass blowing", "glassblowing", "verrerie", "verrier", "stained glass", "vitrail"] },
  { name: "Stone carving", synonyms: ["stonemason", "marbrerie", "marble work", "taille de pierre", "stone work"] },
  { name: "Ceramics", synonyms: ["ceramic", "pottery", "céramique", "tiles", "zellige", "terracotta"] },
  { name: "Marquetry", synonyms: ["marqueterie", "inlay", "veneer"] },
  { name: "Lighting design", synonyms: ["lighting", "luminaire", "lamp", "chandelier", "sconce"] },
  { name: "Textile design", synonyms: ["weaving", "tissage", "rug", "carpet", "tapis", "embroidery"] },
  { name: "Leatherwork", synonyms: ["leather craft", "maroquinerie", "sellerie", "saddlery"] },
  { name: "Gilding", synonyms: ["dorure", "gold leaf", "feuille d'or", "silver leaf"] },
];

export const MATERIALS: Vocab[] = [
  { name: "Solid wood", synonyms: ["wood", "oak", "walnut", "chêne", "noyer", "timber", "burl", "ronce"] },
  { name: "Marble", synonyms: ["marbre", "calacatta", "carrara"] },
  { name: "Natural stone", synonyms: ["stone", "pierre", "travertine", "travertin", "limestone", "granite", "onyx"] },
  { name: "Brass", synonyms: ["laiton", "bronze finish", "gold metal"] },
  { name: "Bronze", synonyms: [] },
  { name: "Copper", synonyms: ["cuivre"] },
  { name: "Steel", synonyms: ["acier", "stainless", "iron", "fer"] },
  { name: "Glass", synonyms: ["verre", "mirror", "miroir", "reeded glass"] },
  { name: "Leather", synonyms: ["cuir", "suede", "daim", "croco", "crocodile"] },
  { name: "Textiles", synonyms: ["fabric", "tissu", "velvet", "velours", "linen", "lin", "bouclé", "boucle", "wool"] },
  { name: "Resin", synonyms: ["résine", "epoxy"] },
  { name: "Ceramic", synonyms: ["porcelain", "porcelaine", "terracotta", "earthenware", "tile"] },
  { name: "Lacquer", synonyms: ["laque", "lacquered"] },
];

export const TECHNIQUES: Vocab[] = [
  { name: "CNC machining", synonyms: ["cnc", "usinage", "machining"] },
  { name: "Hand carving", synonyms: ["carving", "sculpture", "sculpting", "hand carved"] },
  { name: "Marquetry", synonyms: ["inlay"] },
  { name: "Casting", synonyms: ["fonderie", "foundry", "cast"] },
  { name: "Patination", synonyms: ["patina", "patine", "aged finish", "oxidised", "oxidized"] },
  { name: "Sandblasting", synonyms: ["sablage", "sand blasting"] },
  { name: "Forging", synonyms: ["forge", "forgé", "hand forged"] },
  { name: "Lacquering", synonyms: ["lacquer finish", "vernissage"] },
  { name: "Shou Sugi Ban", synonyms: ["yakisugi", "charred wood", "bois brûlé"] },
  { name: "Backlighting", synonyms: ["backlit", "rétroéclairage", "illuminated"] },
  { name: "Tufting", synonyms: ["capitonnage", "chesterfield", "tufted", "capitonné"] },
  { name: "Veneering", synonyms: ["placage", "veneer"] },
];

export const SECTORS: Vocab[] = [
  { name: "Hospitality", synonyms: ["hotel", "hôtel", "hotels", "resort", "spa", "hôtellerie"] },
  { name: "Residential", synonyms: ["residence", "résidence", "home", "house", "apartment", "villa", "maison", "appartement"] },
  { name: "Restaurant", synonyms: ["restaurants", "bar", "café", "cafe", "dining"] },
  { name: "Retail", synonyms: ["shop", "boutique", "store", "magasin"] },
  { name: "Office", synonyms: ["offices", "workspace", "bureau", "bureaux", "corporate"] },
  { name: "Yacht", synonyms: ["yachting", "superyacht", "marine", "boat"] },
  { name: "Art projects", synonyms: ["art", "gallery", "galerie", "museum", "installation"] },
];

export const VOCABULARY: Record<TagKind, Vocab[]> = {
  SKILL: SKILLS,
  MATERIAL: MATERIALS,
  TECHNIQUE: TECHNIQUES,
  SECTOR: SECTORS,
};

export const TAG_KIND_LABEL: Record<TagKind, string> = {
  SKILL: "Skills",
  MATERIAL: "Materials",
  TECHNIQUE: "Techniques",
  SECTOR: "Project sectors",
};

export const COMPANY_KINDS = [
  { value: "ARTISAN", label: "Artisan" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "MANUFACTURER", label: "Manufacturer" },
  { value: "SUPPLIER", label: "Material supplier" },
  { value: "DESIGNER", label: "Designer" },
] as const;

export const CLIENT_TYPES = [
  { value: "PRIVATE", label: "Private client" },
  { value: "ARCHITECT", label: "Architect" },
  { value: "INTERIOR_DESIGNER", label: "Interior designer" },
  { value: "HOTELIER", label: "Hotelier" },
  { value: "RESTAURATEUR", label: "Restaurateur" },
  { value: "DEVELOPER", label: "Property developer" },
] as const;

export const CONTINENTS = ["Europe", "Africa", "North America", "South America", "Middle East", "Asia-Pacific"] as const;

export const PROJECT_TYPES = ["Hotel renovation", "Residential project", "Restaurant", "Retail", "Office", "Yacht", "Other"];
export const SPACE_TYPES = ["Hotel rooms", "Lobby", "Restaurant", "Bar", "Spa", "Outdoor area", "Entire property", "Kitchen", "Bathroom", "Living spaces", "Other"];
export const STYLES = ["Contemporary", "Minimalist", "Traditional", "Organic", "Industrial", "Art Deco", "Mid-century", "Wabi-sabi"];
export const TIMELINES = ["As soon as possible", "Within 3 months", "3–6 months", "6–12 months", "Later", "I'm not sure"];
export const BUDGETS = ["Less than €5,000", "€5,000–€20,000", "€20,000–€50,000", "€50,000–€100,000", "Over €100,000", "Flexible", "To be defined"];
export const LOOKING_FOR = ["Furniture", "Lighting", "Decorative objects", "Materials", "Architectural elements", "Custom-made pieces", "Surfaces & finishes"];
export const PRODUCTION_TYPES = ["Ready-made products", "Custom-made pieces", "Small series", "One-of-a-kind pieces"];
export const PROFESSIONAL_TYPES = ["Manufacturers", "Craftspeople", "Workshops", "Material suppliers", "Designers"];
export const SERVICES = ["Design", "Manufacturing", "Material sourcing", "Delivery", "Installation"];
export const REACH = ["Local", "National", "International", "No preference"];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const UPLOAD_LIMITS = {
  imageBytes: 10 * 1024 * 1024,
  documentBytes: 15 * 1024 * 1024,
  attachmentsPerMessage: 5,
};
