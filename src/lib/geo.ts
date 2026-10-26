// Géographie légère embarquée : géocodage hors-ligne des villes principales + distance.
// Pour un géocodage exhaustif en production, brancher l'API Adresse (FR) ou Mapbox dans `geocode()`.

export type City = { name: string; country: string; lat: number; lng: number; aliases?: string[] };

export const COUNTRY_CONTINENT: Record<string, string> = {
  France: "Europe", Monaco: "Europe", Belgium: "Europe", Switzerland: "Europe", Italy: "Europe", Spain: "Europe",
  Portugal: "Europe", "United Kingdom": "Europe", Ireland: "Europe", Netherlands: "Europe", Germany: "Europe",
  Austria: "Europe", Denmark: "Europe", Sweden: "Europe", Norway: "Europe", Greece: "Europe", Turkey: "Europe",
  Luxembourg: "Europe", Poland: "Europe", "Czech Republic": "Europe",
  "United Arab Emirates": "Middle East", Qatar: "Middle East", "Saudi Arabia": "Middle East", Lebanon: "Middle East",
  Morocco: "Africa", Egypt: "Africa", Tunisia: "Africa", "South Africa": "Africa", Senegal: "Africa",
  "United States": "North America", Canada: "North America", Mexico: "North America",
  Brazil: "South America", Argentina: "South America", Colombia: "South America",
  Singapore: "Asia-Pacific", "Hong Kong": "Asia-Pacific", China: "Asia-Pacific", Japan: "Asia-Pacific",
  "South Korea": "Asia-Pacific", Australia: "Asia-Pacific", Thailand: "Asia-Pacific", India: "Asia-Pacific", Indonesia: "Asia-Pacific",
};

export const COUNTRIES = Object.keys(COUNTRY_CONTINENT).sort();

const COUNTRY_ALIASES: Record<string, string> = {
  uk: "United Kingdom", england: "United Kingdom", "great britain": "United Kingdom", angleterre: "United Kingdom",
  usa: "United States", us: "United States", "etats-unis": "United States", "états-unis": "United States", america: "United States",
  uae: "United Arab Emirates", emirates: "United Arab Emirates", italie: "Italy", espagne: "Spain", allemagne: "Germany",
  belgique: "Belgium", suisse: "Switzerland", "pays-bas": "Netherlands", holland: "Netherlands", maroc: "Morocco",
  grece: "Greece", grèce: "Greece", turquie: "Turkey", japon: "Japan", chine: "China", "royaume-uni": "United Kingdom",
};

export const CITIES: City[] = [
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Lyon", country: "France", lat: 45.764, lng: 4.8357 },
  { name: "Marseille", country: "France", lat: 43.2965, lng: 5.3698 },
  { name: "Nice", country: "France", lat: 43.7102, lng: 7.262 },
  { name: "Cannes", country: "France", lat: 43.5528, lng: 7.0174 },
  { name: "Bordeaux", country: "France", lat: 44.8378, lng: -0.5792 },
  { name: "Toulouse", country: "France", lat: 43.6047, lng: 1.4442 },
  { name: "Lille", country: "France", lat: 50.6292, lng: 3.0573 },
  { name: "Nantes", country: "France", lat: 47.2184, lng: -1.5536 },
  { name: "Strasbourg", country: "France", lat: 48.5734, lng: 7.7521 },
  { name: "Montpellier", country: "France", lat: 43.6108, lng: 3.8767 },
  { name: "Rennes", country: "France", lat: 48.1173, lng: -1.6778 },
  { name: "Annecy", country: "France", lat: 45.8992, lng: 6.1294 },
  { name: "Grenoble", country: "France", lat: 45.1885, lng: 5.7245 },
  { name: "Limoges", country: "France", lat: 45.8336, lng: 1.2611 },
  { name: "Aix-en-Provence", country: "France", lat: 43.5297, lng: 5.4474 },
  { name: "Monaco", country: "Monaco", lat: 43.7384, lng: 7.4246, aliases: ["monte-carlo", "monte carlo"] },
  { name: "Brussels", country: "Belgium", lat: 50.8503, lng: 4.3517, aliases: ["bruxelles"] },
  { name: "Antwerp", country: "Belgium", lat: 51.2194, lng: 4.4025, aliases: ["anvers"] },
  { name: "Geneva", country: "Switzerland", lat: 46.2044, lng: 6.1432, aliases: ["genève", "geneve"] },
  { name: "Lausanne", country: "Switzerland", lat: 46.5197, lng: 6.6323 },
  { name: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417 },
  { name: "Milan", country: "Italy", lat: 45.4642, lng: 9.19, aliases: ["milano"] },
  { name: "Como", country: "Italy", lat: 45.8081, lng: 9.0852, aliases: ["côme"] },
  { name: "Florence", country: "Italy", lat: 43.7696, lng: 11.2558, aliases: ["firenze"] },
  { name: "Venice", country: "Italy", lat: 45.4408, lng: 12.3155, aliases: ["venise", "venezia"] },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, aliases: ["roma"] },
  { name: "Turin", country: "Italy", lat: 45.0703, lng: 7.6869, aliases: ["torino"] },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686, aliases: ["barcelone"] },
  { name: "Valencia", country: "Spain", lat: 39.4699, lng: -0.3763 },
  { name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393, aliases: ["lisbonne", "lisboa"] },
  { name: "Porto", country: "Portugal", lat: 41.1579, lng: -8.6291 },
  { name: "London", country: "United Kingdom", lat: 51.5072, lng: -0.1276, aliases: ["londres"] },
  { name: "Manchester", country: "United Kingdom", lat: 53.4808, lng: -2.2426 },
  { name: "Edinburgh", country: "United Kingdom", lat: 55.9533, lng: -3.1883 },
  { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Rotterdam", country: "Netherlands", lat: 51.9244, lng: 4.4777 },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { name: "Munich", country: "Germany", lat: 48.1351, lng: 11.582, aliases: ["münchen"] },
  { name: "Hamburg", country: "Germany", lat: 53.5511, lng: 9.9937 },
  { name: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738, aliases: ["vienne", "wien"] },
  { name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683, aliases: ["copenhague"] },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522 },
  { name: "Athens", country: "Greece", lat: 37.9838, lng: 23.7275, aliases: ["athènes"] },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
  { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708, aliases: ["dubaï"] },
  { name: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4539, lng: 54.3773 },
  { name: "Doha", country: "Qatar", lat: 25.2854, lng: 51.531 },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753, aliases: ["riyad"] },
  { name: "Beirut", country: "Lebanon", lat: 33.8938, lng: 35.5018, aliases: ["beyrouth"] },
  { name: "Marrakech", country: "Morocco", lat: 31.6295, lng: -7.9811, aliases: ["marrakesh"] },
  { name: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898 },
  { name: "Fez", country: "Morocco", lat: 34.0181, lng: -5.0078, aliases: ["fès", "fes"] },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, aliases: ["le caire"] },
  { name: "Tunis", country: "Tunisia", lat: 36.8065, lng: 10.1815 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "New York", country: "United States", lat: 40.7128, lng: -74.006, aliases: ["nyc"] },
  { name: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437, aliases: ["la"] },
  { name: "Miami", country: "United States", lat: 25.7617, lng: -80.1918 },
  { name: "Montreal", country: "Canada", lat: 45.5019, lng: -73.5674, aliases: ["montréal"] },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, aliases: ["mexico"] },
  { name: "São Paulo", country: "Brazil", lat: -23.5558, lng: -46.6396, aliases: ["sao paulo"] },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, aliases: ["singapour"] },
  { name: "Hong Kong", country: "Hong Kong", lat: 22.3193, lng: 114.1694 },
  { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Kyoto", country: "Japan", lat: 35.0116, lng: 135.7681 },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, aliases: ["séoul"] },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, aliases: ["bombay"] },
  { name: "Bali", country: "Indonesia", lat: -8.3405, lng: 115.092 },
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const cityIndex = new Map<string, City>();
for (const c of CITIES) {
  cityIndex.set(norm(c.name), c);
  for (const a of c.aliases ?? []) cityIndex.set(norm(a), c);
}
const countryIndex = new Map<string, string>();
for (const c of COUNTRIES) countryIndex.set(norm(c), c);
for (const [a, c] of Object.entries(COUNTRY_ALIASES)) countryIndex.set(norm(a), c);

export function findCity(name: string | null | undefined) {
  return name ? cityIndex.get(norm(name)) ?? null : null;
}

export function findCountry(name: string | null | undefined) {
  return name ? countryIndex.get(norm(name)) ?? null : null;
}

export function continentOf(country: string | null | undefined) {
  return country ? COUNTRY_CONTINENT[country] ?? null : null;
}

/** Détecte une ville ou un pays dans un texte libre (n-grammes de 1 à 3 mots). */
export function detectLocation(text: string): { city?: City; country?: string; matched: string[] } {
  const words = norm(text).replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
  const matched: string[] = [];
  let city: City | undefined;
  let country: string | undefined;
  for (let size = 3; size >= 1; size--) {
    for (let i = 0; i + size <= words.length; i++) {
      const gram = words.slice(i, i + size).join(" ");
      if (gram.length < 3 && size === 1) continue;
      const c = cityIndex.get(gram);
      if (c && !city && gram !== "la") {
        city = c;
        matched.push(gram);
      }
      const k = countryIndex.get(gram);
      if (k && !country && gram !== "us") {
        country = k;
        matched.push(gram);
      }
    }
  }
  if (city && !country) country = city.country;
  return { city, country, matched };
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Géocodage d'une adresse saisie (ville connue → coordonnées). */
export function geocode(city?: string | null, country?: string | null) {
  const c = findCity(city);
  if (c && (!country || findCountry(country) === c.country)) return { lat: c.lat, lng: c.lng };
  return null;
}
