// Contenus éditoriaux (« Content » dans la maquette). Stockés en code pour l'instant ;
// à brancher sur un CMS (Sanity, Contentful…) quand l'équipe éditoriale sera en place.

export type Article = { slug: string; title: string; excerpt: string; category: string; date: string; image: string; readingTime: number; body: string[] };

export const ARTICLES: Article[] = [
  {
    slug: "the-return-of-patinated-brass",
    title: "The return of patinated brass",
    excerpt: "From members' clubs to family kitchens, living metal finishes are replacing polished perfection. We met the workshops behind the trend.",
    category: "Materials",
    date: "2026-10-12",
    image: "/images/insights.webp",
    readingTime: 5,
    body: [
      "For a decade, interiors chased flawless surfaces: lacquered, polished, uniform. The pendulum has swung. On SEFIKH, searches for patinated brass have tripled in a year, driven by hospitality projects looking for warmth and by private clients tired of the showroom look.",
      "A patina is a controlled oxidation. Workshops use acids, heat and waxes to accelerate what time would do in decades — and every sheet reacts differently. That is precisely what designers are after: a surface that changes with light and touch.",
      "The practical questions come quickly: will it keep evolving? Can it be cleaned? The best ateliers answer with a sample programme. Ask for three tones, see them on site, under your own lighting, before signing off.",
      "Lead times are the other key point. A patinated kitchen front takes between two and five months depending on surface area. Plan the order before the joinery, not after.",
    ],
  },
  {
    slug: "briefing-a-maker",
    title: "How to brief a maker (and get a useful answer)",
    excerpt: "Quantities, tolerances, deadlines: the seven pieces of information artisans need to quote quickly and accurately.",
    category: "Guides",
    date: "2026-09-28",
    image: "/images/join-1.webp",
    readingTime: 4,
    body: [
      "A vague brief gets a vague quote — or none at all. Workshops receive many enquiries, and they prioritise the ones they can actually price.",
      "Start with the type of project and its location: a hotel in Nice and a villa in Dubai do not involve the same logistics. Then give quantities, even approximate: one bar counter or twenty identical vanities is a different job.",
      "Share references. A moodboard image says more than three paragraphs, and on SEFIKH you can attach it directly to the conversation. Indicate the timeline and a budget range: it is not a commitment, it is a way to propose the right solution.",
      "Finally, say what you need beyond fabrication: design development, delivery, installation. Many makers handle the full process — if they know you need it.",
    ],
  },
  {
    slug: "stone-that-glows",
    title: "Stone that glows: backlit onyx in hospitality",
    excerpt: "Why translucent stones have become the signature of boutique hotels — and what to check before specifying them.",
    category: "Trends",
    date: "2026-09-10",
    image: "/images/pricing.webp",
    readingTime: 6,
    body: [
      "Onyx is a translucent stone: lit from behind, it turns into a lantern. In guest washrooms, bar fronts and reception desks, it creates an instant focal point.",
      "The technical work is invisible but decisive. Slabs are thinned and reinforced, LED strips are diffused to avoid hot spots, and maintenance access must be designed from the start.",
      "Because every slab is unique, book-matching must be planned with the workshop. Visit the slab yard if you can, or ask for high-resolution photos of the actual blocks.",
    ],
  },
];

export function getArticle(slug: string) {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}
