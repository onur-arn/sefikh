// Jeu de données de démonstration : makers (photos du dossier « Photo »), comptes démo,
// projets, conversations, historique de recherches pour les tableaux de bord Insights.
// Lancer : npm run db:seed   (réinitialise les données !)

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { VOCABULARY, type TagKind } from "../src/lib/constants";
import { continentOf, geocode } from "../src/lib/geo";
import { processImage, colorVector, toBytes } from "../src/lib/images";
import { embedImage } from "../src/lib/clip";
import { slugify } from "../src/lib/utils";

const db = new PrismaClient();
const PASSWORD = "Sefikh2026!";
const asset = (n: string) => path.join(__dirname, "seed-assets", `${n}.jpg`);

type Seed = {
  name: string;
  owner: string;
  email: string;
  kind: string;
  tagline: string;
  about: string;
  city: string;
  country: string;
  sector: string;
  plan: string;
  founded: number;
  team: string;
  leadTime: [number, number];
  availability: number[];
  capacity: string;
  areas: string[];
  keywords: string[];
  tags: Partial<Record<TagKind, string[]>>;
  photos: { file: string; title: string; description: string; project?: string; location?: string; year?: number }[];
};

const MAKERS: Seed[] = [
  {
    name: "Atelier Laiton & Patine",
    owner: "Camille Roussel",
    email: "pro@sefikh.demo",
    kind: "WORKSHOP",
    tagline: "Hand-patinated brass, bronze & copper surfaces",
    about:
      "Founded in Lyon by two metalworkers trained with Compagnons du Devoir, our workshop creates bespoke metal surfaces for kitchens, bars and hotel lobbies. Every sheet of brass is hand-patinated in our atelier using traditional acids, waxes and heat, so that no two pieces are ever alike. We work hand in hand with architects from the first sample to the installation on site.",
    city: "Lyon",
    country: "France",
    sector: "Architectural metalwork",
    plan: "PRO_VISIBILITY",
    founded: 2009,
    team: "11–25",
    leadTime: [2, 5],
    availability: [1, 2, 3, 6, 7, 9, 10, 11],
    capacity: "Up to 300 m² of patinated surfaces per month · sheets up to 3 × 1.5 m · in-house CNC folding",
    areas: ["Europe", "Middle East"],
    keywords: ["bespoke kitchen fronts", "bar counters", "living finishes", "samples in 10 days"],
    tags: { SKILL: ["Metalwork", "Gilding"], MATERIAL: ["Brass", "Bronze", "Copper", "Steel"], TECHNIQUE: ["Patination", "Casting", "CNC machining"], SECTOR: ["Residential", "Hospitality", "Restaurant"] },
    photos: [
      { file: "03", title: "Patinated brass kitchen", description: "Full-height cabinet fronts in hand-patinated brass with copper and rust tones.", project: "Private residence", location: "Lyon", year: 2025 },
      { file: "02", title: "Oxidised steel kitchen island", description: "Kitchen island and splashback in oxidised steel with brass inlays.", project: "Penthouse renovation", location: "Geneva", year: 2024 },
      { file: "09", title: "Gold-leaf bar alcove", description: "Arched bar niche clad in gilded brass with integrated glass shelving.", project: "Members' club", location: "Paris", year: 2025 },
    ],
  },
  {
    name: "Maison Cuir Sauvage",
    owner: "Hugo Martel",
    email: "cuir@sefikh.demo",
    kind: "ARTISAN",
    tagline: "Leather wall panels, tufting & saddlery for interiors",
    about:
      "A Parisian leather atelier specialised in wall coverings, padded doors and upholstered panels. From embossed crocodile hides to hand-tufted chesterfield panels, we bring the warmth of leather to private cinemas, yachts and luxury retail.",
    city: "Paris",
    country: "France",
    sector: "Leather & upholstery",
    plan: "PRO_PRO",
    founded: 1998,
    team: "6–10",
    leadTime: [1, 4],
    availability: [1, 2, 4, 5, 9, 10, 11, 12],
    capacity: "Around 80 m² of leather panels per month · in-house hide selection · nailhead and tufting finishes",
    areas: ["Europe", "Middle East", "North America"],
    keywords: ["home cinema", "padded doors", "yacht interiors", "embossed leather"],
    tags: { SKILL: ["Leatherwork", "Upholstery"], MATERIAL: ["Leather", "Brass"], TECHNIQUE: ["Tufting"], SECTOR: ["Residential", "Yacht", "Retail", "Hospitality"] },
    photos: [
      { file: "04", title: "Embossed leather walls", description: "Crocodile-embossed leather wall panels with brass reveals for a private cinema.", project: "Home theatre", location: "Monaco", year: 2025 },
      { file: "05", title: "Tufted leather panel", description: "Hand-tufted oxblood leather headboard wall, deep buttoned.", project: "Hotel suite", location: "London", year: 2024 },
      { file: "06", title: "Nailhead leather cladding", description: "Aged leather cladding with hand-set nailhead trims.", project: "Cigar lounge", location: "Dubai", year: 2023 },
    ],
  },
  {
    name: "Ébénisterie Racine",
    owner: "Louise Garnier",
    email: "racine@sefikh.demo",
    kind: "WORKSHOP",
    tagline: "Fine cabinetmaking, burl veneers & joinery",
    about:
      "Ébénisterie Racine designs and builds bespoke furniture and wall panelling from its workshop near Bordeaux. Our cabinetmakers master burl veneers, marquetry and traditional joinery, combined with CNC precision for larger hospitality programmes.",
    city: "Bordeaux",
    country: "France",
    sector: "Cabinetmaking",
    plan: "PRO_INTELLIGENCE",
    founded: 1987,
    team: "26–50",
    leadTime: [3, 8],
    availability: [1, 2, 3, 4, 8, 9, 10],
    capacity: "120 rooms of fitted furniture per year · 1,800 m² workshop · 5-axis CNC · in-house lacquer booth",
    areas: ["Europe", "Middle East", "Asia-Pacific"],
    keywords: ["burl wood", "wall panelling", "hotel joinery", "fitted kitchens"],
    tags: { SKILL: ["Cabinetmaking", "Woodworking", "Marquetry"], MATERIAL: ["Solid wood", "Lacquer", "Marble"], TECHNIQUE: ["Veneering", "Marquetry", "CNC machining", "Lacquering"], SECTOR: ["Residential", "Hospitality", "Office"] },
    photos: [
      { file: "07", title: "Burl veneer kitchen", description: "Book-matched burl veneer kitchen with a sculpted stone splashback.", project: "Villa Médoc", location: "Bordeaux", year: 2025 },
      { file: "12", title: "Burl-panelled lounge", description: "Walls and furniture in high-gloss burl veneer for a hotel lounge.", project: "Boutique hotel", location: "Madrid", year: 2024 },
      { file: "21", title: "Walnut dovetail joint", description: "Hand-cut dovetail joinery detail in American walnut and maple.", project: "Dining table", year: 2025 },
    ],
  },
  {
    name: "Onyx & Lumière",
    owner: "Giulia Ferri",
    email: "onyx@sefikh.demo",
    kind: "MANUFACTURER",
    tagline: "Backlit onyx, rare marbles & sculpted stone",
    about:
      "Based between Milan and the quarries of Carrara, Onyx & Lumière transforms rare stones into luminous architectural pieces: backlit onyx vanities, bar fronts and sculpted marble basins. Our engineering team integrates LED backlighting and handles delivery and installation worldwide.",
    city: "Milan",
    country: "Italy",
    sector: "Natural stone",
    plan: "PRO_VISIBILITY",
    founded: 2004,
    team: "51–200",
    leadTime: [2, 6],
    availability: [2, 3, 4, 5, 6, 9, 10, 11],
    capacity: "Slab stock of 60+ rare stones · waterjet & 5-axis CNC · integrated LED backlighting",
    areas: ["Europe", "Middle East", "North America", "Asia-Pacific"],
    keywords: ["backlit onyx", "vanities", "bar fronts", "rare marble"],
    tags: { SKILL: ["Stone carving", "Lighting design"], MATERIAL: ["Natural stone", "Marble"], TECHNIQUE: ["Backlighting", "CNC machining", "Hand carving"], SECTOR: ["Hospitality", "Residential", "Retail"] },
    photos: [
      { file: "10", title: "Backlit onyx vanity", description: "Floating vanity in amber onyx with integrated LED backlighting.", project: "Guest washroom", location: "Milan", year: 2025 },
      { file: "16", title: "Calacatta Viola double basin", description: "Sculpted Calacatta Viola marble double vanity with patterned basins.", project: "Restaurant restrooms", location: "Florence", year: 2024 },
    ],
  },
  {
    name: "Studio Velours",
    owner: "Inès Dubois",
    email: "velours@sefikh.demo",
    kind: "WORKSHOP",
    tagline: "Contemporary upholstery & bespoke seating",
    about:
      "Studio Velours is a Brussels upholstery workshop crafting sculptural sofas, armchairs and banquettes. We work with velvets, bouclés and jacquards from European mills, on solid wood frames made in-house.",
    city: "Brussels",
    country: "Belgium",
    sector: "Upholstery",
    plan: "PRO_PRO",
    founded: 2016,
    team: "6–10",
    leadTime: [1, 3],
    availability: [1, 3, 4, 5, 6, 9, 10, 11, 12],
    capacity: "Around 40 seats per month · small series up to 200 pieces · COM fabrics accepted",
    areas: ["Europe"],
    keywords: ["sofas", "banquettes", "armchairs", "jacquard"],
    tags: { SKILL: ["Upholstery", "Textile design"], MATERIAL: ["Textiles", "Solid wood"], TECHNIQUE: ["Tufting"], SECTOR: ["Residential", "Hospitality", "Restaurant"] },
    photos: [
      { file: "13", title: "Velvet club armchair", description: "Rounded armchair upholstered in a red and gold jacquard velvet.", project: "Hotel bar", location: "Brussels", year: 2025 },
      { file: "15", title: "Sculptural bouclé lounge chair", description: "Organic lounge chair in printed bouclé on a solid oak base.", project: "Gallery edition", year: 2025 },
      { file: "11", title: "Dressing room stool", description: "Leopard velvet pouf for a burl-panelled dressing room.", project: "Private apartment", location: "Antwerp", year: 2024 },
    ],
  },
  {
    name: "Marbrerie Azur",
    owner: "Marc Olivieri",
    email: "azur@sefikh.demo",
    kind: "WORKSHOP",
    tagline: "Marble & stone worktops for the Riviera",
    about:
      "Family-run stone workshop in Nice since 1972. We template, cut and install marble, quartzite and natural stone worktops, floors and bathrooms for villas, restaurants and yachts along the Côte d'Azur.",
    city: "Nice",
    country: "France",
    sector: "Natural stone",
    plan: "PRO_PRO",
    founded: 1972,
    team: "11–25",
    leadTime: [1, 3],
    availability: [1, 2, 3, 10, 11, 12],
    capacity: "Digital templating · bridge saw & waterjet · installation teams on the Riviera",
    areas: ["Europe"],
    keywords: ["worktops", "kitchen islands", "yacht stone", "installation"],
    tags: { SKILL: ["Stone carving"], MATERIAL: ["Marble", "Natural stone"], TECHNIQUE: ["Hand carving", "Sandblasting", "CNC machining"], SECTOR: ["Residential", "Restaurant", "Yacht"] },
    photos: [{ file: "14", title: "Rosso Levanto kitchen", description: "Red marble worktop and splashback with brass hood and walnut cabinetry.", project: "Villa Cap Ferrat", location: "Nice", year: 2025 }],
  },
  {
    name: "Verrerie Lumen",
    owner: "Thomas Keller",
    email: "lumen@sefikh.demo",
    kind: "ARTISAN",
    tagline: "Reeded, cast & stained glass for interiors",
    about:
      "Glassmaker in Strasbourg producing reeded, fluted and cast glass for joinery, partitions and lighting. We collaborate with cabinetmakers and metalworkers on bespoke bar back-walls and display cabinetry.",
    city: "Strasbourg",
    country: "France",
    sector: "Glass",
    plan: "PRO_PRO",
    founded: 2012,
    team: "1–5",
    leadTime: [1, 2],
    availability: [2, 3, 4, 5, 6, 7, 9, 10, 11],
    capacity: "Panels up to 2.4 × 1.2 m · kiln casting · sandblasted patterns",
    areas: ["Europe"],
    keywords: ["fluted glass", "partitions", "bar cabinets", "cast glass"],
    tags: { SKILL: ["Glassmaking"], MATERIAL: ["Glass", "Brass"], TECHNIQUE: ["Casting", "Sandblasting"], SECTOR: ["Hospitality", "Retail", "Restaurant"] },
    photos: [{ file: "17", title: "Reeded glass bar cabinetry", description: "Bar back cabinet with reeded glass doors and bronze frames.", project: "Cocktail bar", location: "Strasbourg", year: 2024 }],
  },
  {
    name: "Zellige & Terre",
    owner: "Yasmina Benali",
    email: "zellige@sefikh.demo",
    kind: "ARTISAN",
    tagline: "Handmade zellige, glazed tiles & terracotta",
    about:
      "Between Marseille and Fez, our ceramicists produce hand-cut zellige and glazed tiles in custom colours. Each tile is shaped, glazed and fired by hand, giving surfaces their living, irregular shimmer.",
    city: "Marseille",
    country: "France",
    sector: "Ceramics",
    plan: "PRO_PRO",
    founded: 2014,
    team: "6–10",
    leadTime: [2, 4],
    availability: [1, 2, 3, 4, 5, 9, 10, 11, 12],
    capacity: "Around 400 m² of tiles per month · custom glazes in 3 weeks",
    areas: ["Europe", "Africa", "Middle East"],
    keywords: ["zellige", "bathroom tiles", "custom glaze", "kitchen backsplash"],
    tags: { SKILL: ["Ceramics"], MATERIAL: ["Ceramic", "Glass"], TECHNIQUE: ["Lacquering"], SECTOR: ["Residential", "Restaurant", "Hospitality"] },
    photos: [
      { file: "08", title: "Burgundy zellige bathroom", description: "Deep red glazed tiles, glass block shower and copper tub.", project: "Townhouse", location: "Marseille", year: 2025 },
      { file: "18", title: "Teal harlequin kitchen", description: "Hand-glazed teal tiles in a harlequin pattern behind walnut cabinetry.", project: "Brasserie kitchen", location: "Lyon", year: 2024 },
    ],
  },
  {
    name: "Forma Hospitality Interiors",
    owner: "Daniel Tan",
    email: "forma@sefikh.demo",
    kind: "MANUFACTURER",
    tagline: "Turnkey FF&E manufacturing for luxury hotels",
    about:
      "Forma manufactures fitted furniture, upholstery and decorative metalwork for five-star hotels across Asia-Pacific, with European-trained workshop leads. A bespoke hotel project in Singapore, brought to life through the expertise of our workshops: every detail reflects our commitment to exceptional craftsmanship.",
    city: "Singapore",
    country: "Singapore",
    sector: "Hospitality FF&E",
    plan: "PRO_INTELLIGENCE",
    founded: 2001,
    team: "200+",
    leadTime: [4, 12],
    availability: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    capacity: "Up to 600 hotel rooms per year · mock-up room in 6 weeks · global logistics",
    areas: ["Asia-Pacific", "Middle East", "Europe"],
    keywords: ["FF&E", "hotel rooms", "mock-up rooms", "turnkey"],
    tags: { SKILL: ["Cabinetmaking", "Upholstery", "Metalwork"], MATERIAL: ["Solid wood", "Marble", "Textiles", "Brass"], TECHNIQUE: ["CNC machining", "Veneering"], SECTOR: ["Hospitality", "Residential"] },
    photos: [{ file: "01", title: "Hotel suite with river view", description: "Guest room joinery, marble vanity and bespoke carpet for a five-star hotel.", project: "Luxury hotel", location: "Shanghai", year: 2024 }],
  },
  {
    name: "Atelier Pierre & Bois",
    owner: "Élise Fournier",
    email: "pierrebois@sefikh.demo",
    kind: "ARTISAN",
    tagline: "Sculptors of stone and timber",
    about:
      "An Alpine atelier where stone and wood meet. We carve one-of-a-kind sculptural furniture and art pieces by hand, combining river boulders with solid larch and oak.",
    city: "Annecy",
    country: "France",
    sector: "Art & sculpture",
    plan: "PRO_PRO",
    founded: 2019,
    team: "1–5",
    leadTime: [2, 6],
    availability: [4, 5, 6, 7, 8, 9],
    capacity: "One-of-a-kind pieces · up to 8 commissions per year",
    areas: ["Europe"],
    keywords: ["sculpture", "one-of-a-kind", "art furniture", "boulder"],
    tags: { SKILL: ["Stone carving", "Woodworking"], MATERIAL: ["Natural stone", "Solid wood"], TECHNIQUE: ["Hand carving"], SECTOR: ["Art projects", "Residential"] },
    photos: [
      { file: "19", title: "Boulder and timber sculpture", description: "River boulder embraced by a hand-carved larch timber joint.", project: "Gallery commission", location: "Annecy", year: 2025 },
      { file: "20", title: "Hand-planed oak", description: "Hand planing in the workshop — every surface is finished by hand.", project: "Workshop", year: 2025 },
    ],
  },
];

const ADMIN_DEMO = { name: "SEFIKH Admin", email: "admin@sefikh.demo" };
const CLIENT_DEMO = { name: "Sophie Laurent", email: "client@sefikh.demo", studio: "Studio Laurent Architecture", city: "Paris" };

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000 - Math.random() * 86400_000);

async function main() {
  console.log("→ Nettoyage");
  await db.$transaction([
    db.searchImpression.deleteMany(),
    db.searchLog.deleteMany(),
    db.profileView.deleteMany(),
    db.attachment.deleteMany(),
    db.message.deleteMany(),
    db.conversation.deleteMany(),
    db.notification.deleteMany(),
    db.savedCompany.deleteMany(),
    db.document.deleteMany(),
    db.project.deleteMany(),
    db.payment.deleteMany(),
    db.subscription.deleteMany(),
    db.portfolioImage.deleteMany(),
    db.companyTag.deleteMany(),
    db.company.deleteMany(),
    db.clientProfile.deleteMany(),
    db.session.deleteMany(),
    db.authToken.deleteMany(),
    db.user.deleteMany(),
    db.tag.deleteMany(),
  ]);

  console.log("→ Vocabulaire");
  for (const [kind, entries] of Object.entries(VOCABULARY)) {
    for (const v of entries) await db.tag.create({ data: { kind, name: v.name, slug: slugify(v.name) } });
  }
  const tags = await db.tag.findMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const now = new Date();

  console.log("→ Makers & portfolios (calcul des empreintes CLIP)");
  const companies: Awaited<ReturnType<typeof db.company.create>>[] = [];
  for (const m of MAKERS) {
    const geo = geocode(m.city, m.country);
    const user = await db.user.create({
      data: { name: m.owner, email: m.email, role: "PRO", plan: m.plan, passwordHash, emailVerifiedAt: now },
    });
    const company = await db.company.create({
      data: {
        userId: user.id,
        slug: slugify(m.name),
        name: m.name,
        tagline: m.tagline,
        about: m.about,
        kind: m.kind,
        sector: m.sector,
        publicEmail: m.email.replace("@sefikh.demo", "@studio.example"),
        phone: "+33 4 00 00 00 00",
        website: `https://${slugify(m.name)}.example`,
        city: m.city,
        country: m.country,
        continent: continentOf(m.country),
        lat: geo?.lat,
        lng: geo?.lng,
        operationAreas: JSON.stringify(m.areas),
        keywords: JSON.stringify(m.keywords),
        productionCapacity: m.capacity,
        leadTimeMin: m.leadTime[0],
        leadTimeMax: m.leadTime[1],
        availability: JSON.stringify(m.availability),
        foundedYear: m.founded,
        teamSize: m.team,
        verified: m.plan !== "PRO_BASIC",
        published: true,
        tags: {
          create: Object.entries(m.tags).flatMap(([kind, names]) =>
            names!.map((n) => ({ tagId: tags.find((t) => t.kind === kind && t.name === n)!.id })),
          ),
        },
      },
    });
    let position = 0;
    for (const p of m.photos) {
      const raw = await readFile(asset(p.file));
      const img = await processImage(raw, "portfolio", { maxSize: 1800, thumbSize: 720 });
      const [embedding, colors] = await Promise.all([embedImage(img.buffer), colorVector(img.buffer)]);
      await db.portfolioImage.create({
        data: {
          companyId: company.id,
          key: img.key,
          thumbKey: img.thumbKey,
          width: img.width,
          height: img.height,
          title: p.title,
          description: p.description,
          projectName: p.project,
          location: p.location,
          year: p.year,
          embedding: embedding ? new Uint8Array(toBytes(embedding)) : null,
          colorVector: JSON.stringify(colors),
          position: position++,
        },
      });
      process.stdout.write(".");
    }
    if (m.plan !== "PRO_BASIC") {
      const sub = await db.subscription.create({
        data: { userId: user.id, plan: m.plan, term: "ANNUAL", status: "ACTIVE", provider: "simulated", amount: { PRO_PRO: 14900, PRO_VISIBILITY: 29900, PRO_INTELLIGENCE: 49900 }[m.plan] ?? 0, currentPeriodEnd: new Date(Date.now() + 20 * 86400_000), commitmentEndsAt: new Date(Date.now() + 200 * 86400_000) },
      });
      for (let i = 1; i <= 3; i++) {
        await db.payment.create({ data: { userId: user.id, amount: sub.amount, status: "PAID", description: `SEFIKH Business — ${m.plan.replace("PRO_", "")} (monthly)`, createdAt: daysAgo(i * 30 - 10) } });
      }
    }
    companies.push(company);
  }
  console.log();

  console.log("→ Compte administrateur");
  await db.user.create({ data: { name: ADMIN_DEMO.name, email: ADMIN_DEMO.email, role: "ADMIN", plan: "CLIENT_STUDIO", passwordHash, emailVerifiedAt: now } });

  console.log("→ Comptes créatifs");
  const client = await db.user.create({
    data: {
      name: CLIENT_DEMO.name,
      email: CLIENT_DEMO.email,
      role: "CLIENT",
      plan: "CLIENT_PRO",
      passwordHash,
      emailVerifiedAt: now,
      clientProfile: { create: { studioName: CLIENT_DEMO.studio, clientType: "ARCHITECT", sector: "Hospitality & residential", city: CLIENT_DEMO.city, country: "France", phone: "+33 1 00 00 00 00", bio: "Interior architecture studio focused on boutique hotels and private residences." } },
      subscriptions: { create: { plan: "CLIENT_PRO", term: "MONTHLY", status: "ACTIVE", provider: "simulated", amount: 4900, currentPeriodEnd: new Date(Date.now() + 12 * 86400_000) } },
      payments: { create: [{ amount: 4900, status: "PAID", description: "SEFIKH Creative — Pro (monthly)", createdAt: daysAgo(18) }] },
    },
  });
  const others = [];
  for (const [name, type, city] of [["Antoine Morel", "INTERIOR_DESIGNER", "Lyon"], ["Hôtel Belle Rive", "HOTELIER", "Nice"], ["Clara Weiss", "ARCHITECT", "Geneva"], ["Nour Haddad", "INTERIOR_DESIGNER", "Dubai"]] as const) {
    others.push(
      await db.user.create({
        data: { name, email: `${slugify(name)}@client.demo`, role: "CLIENT", plan: "CLIENT_FREE", passwordHash, emailVerifiedAt: now, clientProfile: { create: { clientType: type, city } } },
      }),
    );
  }

  console.log("→ Projets");
  const hotel = await db.project.create({
    data: {
      ownerId: client.id,
      title: "Hotel Belle Époque — renovation",
      projectType: "Hotel renovation",
      description: "Renovation of a 20-room boutique hotel on the Promenade des Anglais: contemporary and warm atmosphere, custom furniture, brass and stone details.",
      city: "Nice",
      country: "France",
      size: "20 rooms + lobby bar",
      spaceTypes: JSON.stringify(["Hotel rooms", "Lobby", "Bar"]),
      style: "Contemporary and warm",
      materials: JSON.stringify(["Solid wood", "Natural stone", "Brass"]),
      lookingFor: "Custom-made pieces",
      productionType: "Custom-made pieces",
      quantities: "20 bed heads, 20 vanities, 1 bar counter",
      timeline: "6–12 months",
      budget: "To be defined",
      professionalTypes: JSON.stringify(["Manufacturers", "Craftspeople", "Material suppliers"]),
      services: JSON.stringify(["Manufacturing", "Delivery", "Installation"]),
      reach: "International",
      clientType: "ARCHITECT",
    },
  });
  const monaco = await db.project.create({
    data: { ownerId: client.id, title: "Private cinema — Monaco", projectType: "Residential project", city: "Monaco", country: "Monaco", style: "Art Deco", materials: JSON.stringify(["Leather", "Brass"]), timeline: "3–6 months", budget: "€50,000–€100,000", clientType: "ARCHITECT", spaceTypes: "[]", professionalTypes: "[]", services: "[]" },
  });
  await db.project.create({
    data: { ownerId: client.id, title: "Apartment Haussmann — kitchen", projectType: "Residential project", city: "Paris", country: "France", style: "Contemporary", materials: JSON.stringify(["Marble", "Solid wood"]), timeline: "Within 3 months", budget: "€20,000–€50,000", status: "ARCHIVED", clientType: "ARCHITECT", spaceTypes: "[]", professionalTypes: "[]", services: "[]" },
  });

  console.log("→ Conversations");
  const bySlug = (s: string) => companies.find((c) => c.slug === s)!;
  const owners = await db.user.findMany({ where: { role: "PRO" } });
  const ownerOf = (companyId: string) => owners.find((o) => o.id === companies.find((c) => c.id === companyId)!.userId)!;
  const threads: { company: string; project?: string; subject: string; msgs: [string, string, number][] }[] = [
    {
      company: "atelier-laiton-patine",
      project: hotel.id,
      subject: "Brass bar counter — Hotel Belle Époque",
      msgs: [
        ["client", "Hello Camille, we are renovating a 20-room hotel in Nice and love your patinated brass work. Could you make a 6-metre bar counter front with a warm, slightly irregular patina?", 6],
        ["pro", "Hello Sophie, thank you for reaching out! Yes, absolutely — we did a similar bar for a members' club in Paris last year. Could you share the drawings and the expected installation date?", 5],
        ["client", "Of course, I will upload the plans. Installation would be in March. Budget for the bar is around €35k.", 5],
        ["pro", "Perfect. We can send you three patina samples within 10 days so you can validate the tone on site.", 1],
      ],
    },
    {
      company: "maison-cuir-sauvage",
      project: monaco.id,
      subject: "Leather wall panels for a private cinema",
      msgs: [
        ["client", "Hi Hugo, we are designing a private cinema in Monaco (approx. 45 m² of wall). We'd like embossed dark leather panels with brass reveals, similar to your crocodile project.", 3],
        ["pro", "Bonjour Sophie, lovely project. For acoustic performance we would back the leather with 25 mm foam. I can prepare a quote once I have the elevations.", 2],
      ],
    },
    {
      company: "onyx-lumiere",
      project: hotel.id,
      subject: "Backlit onyx vanities x 20",
      msgs: [["client", "Buongiorno Giulia, would you be able to produce 20 backlit onyx vanities for hotel bathrooms? Lead time would be key for us.", 0]],
    },
  ];
  for (const t of threads) {
    const company = bySlug(t.company);
    const owner = ownerOf(company.id);
    const conv = await db.conversation.create({ data: { clientId: client.id, companyId: company.id, projectId: t.project, subject: t.subject, createdAt: daysAgo(t.msgs[0]![2]) } });
    let last = new Date();
    for (const [who, body, d] of t.msgs) {
      last = daysAgo(d);
      await db.message.create({ data: { conversationId: conv.id, senderId: who === "client" ? client.id : owner.id, body, createdAt: last } });
    }
    const lastWho = t.msgs.at(-1)![0];
    await db.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: last, clientLastReadAt: lastWho === "client" ? last : daysAgo(4), proLastReadAt: lastWho === "pro" ? last : null },
    });
  }
  // Demandes d'autres créatifs vers le compte pro de démo
  const laiton = bySlug("atelier-laiton-patine");
  for (const [i, o] of others.slice(0, 2).entries()) {
    const conv = await db.conversation.create({ data: { clientId: o.id, companyId: laiton.id, subject: i ? "Brass reception desk" : "Copper range hood", createdAt: daysAgo(2 + i) } });
    const m = await db.message.create({ data: { conversationId: conv.id, senderId: o.id, body: i ? "Hello, we are looking for a patinated brass reception desk for a hotel in Nice. Are you available for a project starting in February?" : "Bonjour, could you make a copper range hood with a verdigris patina for a restaurant kitchen in Lyon?", createdAt: daysAgo(2 + i) } });
    await db.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: m.createdAt } });
    await db.notification.create({ data: { userId: laiton.userId, type: "CONTACT_REQUEST", title: `New request from ${o.name}`, body: m.body.slice(0, 120), link: `/messages?c=${conv.id}`, createdAt: m.createdAt } });
  }

  await db.savedCompany.createMany({ data: ["atelier-laiton-patine", "onyx-lumiere", "ebenisterie-racine"].map((s) => ({ userId: client.id, companyId: bySlug(s).id })) });
  await db.notification.create({ data: { userId: client.id, type: "MESSAGE", title: "New message from Atelier Laiton & Patine", body: "Perfect. We can send you three patina samples within 10 days…", link: "/messages" } });

  console.log("→ Historique de recherches (12 mois) pour Trends & Insights");
  const terms: [TagKind, string, number][] = [
    ["SKILL", "Cabinetmaking", 10], ["SKILL", "Metalwork", 9], ["SKILL", "Upholstery", 7], ["SKILL", "Stone carving", 6], ["SKILL", "Glassmaking", 4], ["SKILL", "Ceramics", 5], ["SKILL", "Leatherwork", 3], ["SKILL", "Lighting design", 4],
    ["MATERIAL", "Solid wood", 10], ["MATERIAL", "Marble", 8], ["MATERIAL", "Brass", 9], ["MATERIAL", "Natural stone", 6], ["MATERIAL", "Leather", 4], ["MATERIAL", "Textiles", 5], ["MATERIAL", "Glass", 4],
    ["TECHNIQUE", "Patination", 6], ["TECHNIQUE", "CNC machining", 5], ["TECHNIQUE", "Hand carving", 4], ["TECHNIQUE", "Backlighting", 3], ["TECHNIQUE", "Marquetry", 3], ["TECHNIQUE", "Shou Sugi Ban", 2],
    ["SECTOR", "Hospitality", 10], ["SECTOR", "Residential", 9], ["SECTOR", "Restaurant", 5], ["SECTOR", "Retail", 3], ["SECTOR", "Yacht", 2],
  ];
  const weighted = (kind: TagKind) => {
    const pool = terms.filter((t) => t[0] === kind);
    const total = pool.reduce((a, t) => a + t[2], 0);
    let r = Math.random() * total;
    for (const t of pool) if ((r -= t[2]) <= 0) return `${t[0]}:${t[1]}`;
    return `${pool[0]![0]}:${pool[0]![1]}`;
  };
  const locations = ["Paris", "Nice", "Lyon", "Milan", "London", "Dubai", "Geneva", "Monaco", "Brussels", "New York", "Singapore", "Marrakech"];
  const logs = [];
  for (let i = 0; i < 6000; i++) {
    // Distribution croissante dans le temps (plateforme en lancement)
    const age = Math.floor((1 - Math.pow(Math.random(), 0.55)) * 365);
    const t = [weighted("SKILL"), weighted("MATERIAL")];
    if (Math.random() < 0.6) t.push(weighted("SECTOR"));
    if (Math.random() < 0.35) t.push(weighted("TECHNIQUE"));
    logs.push({
      mode: rand(["TEXT", "TEXT", "TEXT", "FILTER", "IMAGE", "PROJECT"]),
      terms: JSON.stringify(t),
      location: Math.random() < 0.55 ? rand(locations) : null,
      visitorId: `seed-${Math.floor(Math.random() * 900)}`,
      resultsCount: 2 + Math.floor(Math.random() * 8),
      createdAt: daysAgo(age),
    });
  }
  await db.searchLog.createMany({ data: logs });

  console.log("→ Vues de profil & impressions");
  const views = [];
  for (let i = 0; i < 1600; i++) {
    const c = rand(companies);
    views.push({ companyId: c.id, source: rand(["SEARCH", "SEARCH", "IMAGE", "DIRECT"]), createdAt: daysAgo(Math.floor(Math.pow(Math.random(), 0.8) * 120)) });
  }
  await db.profileView.createMany({ data: views });
  const someLogs = await db.searchLog.findMany({ take: 600, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } });
  const imps = someLogs.flatMap((l) => companies.sort(() => Math.random() - 0.5).slice(0, 4).map((c, rank) => ({ searchId: l.id, companyId: c.id, rank: rank + 1, createdAt: l.createdAt })));
  await db.searchImpression.createMany({ data: imps });
  // Conversations historiques (statistiques « Connection requests »)
  for (let i = 0; i < 40; i++) {
    const o = rand(others);
    const c = rand(companies);
    const exists = await db.conversation.findFirst({ where: { clientId: o.id, companyId: c.id } });
    if (exists) continue;
    const created = daysAgo(Math.floor(Math.random() * 330) + 10);
    const conv = await db.conversation.create({ data: { clientId: o.id, companyId: c.id, subject: "Project enquiry", createdAt: created, lastMessageAt: created, clientArchived: true, proArchived: true, clientLastReadAt: created, proLastReadAt: created } });
    await db.message.create({ data: { conversationId: conv.id, senderId: o.id, body: "Hello, we would like to discuss a project with you.", createdAt: created } });
  }

  console.log(`\n✔ Seed terminé.\n  Créatif : ${CLIENT_DEMO.email}\n  Maker   : pro@sefikh.demo\n  Mot de passe : ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
