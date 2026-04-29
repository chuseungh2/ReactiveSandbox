// scripts/buildPlanets.mjs
// One-time data curation script. Takes a list of ~40 well-documented
// exoplanets (sourced from the NASA Exoplanet Archive's pscomppars table,
// values cross-checked against published papers and the Habitable Worlds
// Catalogue at PHL) and writes the canonical public/planets.json.
//
// Usage:  node scripts/buildPlanets.mjs
//
// Inputs are in *scientific* units (parsecs, kelvin) and the script
// converts to the units the React app uses (light years, °C).

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
const PC_TO_LY = 3.26156;

function classifyPlanetType(radiusEarth) {
  if (radiusEarth < 1.5) return "rocky";
  if (radiusEarth < 2.0) return "super-earth";
  if (radiusEarth < 4.0) return "mini-neptune";
  return "gas-giant";
}

function calculateHabitability(p) {
  // 1. Temperature: closer to 15°C is better (0–40 points)
  const tempDistance = Math.abs(p.equilibriumTempC - 15);
  const tempScore = Math.max(0, 40 - tempDistance * 0.8);

  // 2. Radius: closer to Earth's 1.0 is better (0–30 points)
  const radiusDistance = Math.abs(p.radiusEarth - 1.0);
  const radiusScore = Math.max(0, 30 - radiusDistance * 15);

  // 3. Habitable zone bonus
  const hzScore = p.inHabitableZone ? 20 : 0;

  // 4. Star type bonus: G/K dwarfs ≈ best for life
  const starScore = ["G", "K"].includes(p.starType[0]) ? 10 : 5;

  return Math.round(tempScore + radiusScore + hzScore + starScore);
}

function buildPlanet(raw) {
  const distanceLy = +(raw.distancePc * PC_TO_LY).toFixed(2);
  const equilibriumTempC = Math.round(raw.equilibriumTempK - 273.15);
  const planetType = classifyPlanetType(raw.radiusEarth);

  const partial = {
    id: raw.id,
    name: raw.name,
    hostStar: raw.hostStar,
    starType: raw.starType,
    discoveryMethod: raw.discoveryMethod,
    discoveryYear: raw.discoveryYear,
    distanceLy,
    radiusEarth: raw.radiusEarth,
    massEarth: raw.massEarth,
    orbitalPeriodDays: raw.orbitalPeriodDays,
    equilibriumTempC,
    orbitAU: raw.orbitAU,
    inHabitableZone: raw.inHabitableZone,
    planetType,
  };
  return { ...partial, habitabilityScore: calculateHabitability(partial) };
}

// ──────────────────────────────────────────
// Curated list. Distance in parsecs, temp in Kelvin.
// Values from NASA Exoplanet Archive (pscomppars, accessed Apr 2026)
// and PHL Habitable Worlds Catalog. Where literature gives a range,
// we use the median.
// ──────────────────────────────────────────
const RAW = [
  // ── 10 closest to Earth (≤25 ly) ──
  { id: "proxima-cen-b", name: "Proxima Centauri b", hostStar: "Proxima Centauri",
    starType: "M-dwarf", discoveryMethod: "Radial Velocity", discoveryYear: 2016,
    distancePc: 1.30, radiusEarth: 1.07, massEarth: 1.27, orbitalPeriodDays: 11.19,
    equilibriumTempK: 234, orbitAU: 0.0485, inHabitableZone: true },
  { id: "barnard-b", name: "Barnard b", hostStar: "Barnard's Star",
    starType: "M-dwarf", discoveryMethod: "Radial Velocity", discoveryYear: 2024,
    distancePc: 1.83, radiusEarth: 0.75, massEarth: 0.37, orbitalPeriodDays: 3.15,
    equilibriumTempK: 400, orbitAU: 0.0229, inHabitableZone: false },
  { id: "ross-128-b", name: "Ross 128 b", hostStar: "Ross 128",
    starType: "M-dwarf", discoveryMethod: "Radial Velocity", discoveryYear: 2017,
    distancePc: 3.37, radiusEarth: 1.10, massEarth: 1.40, orbitalPeriodDays: 9.86,
    equilibriumTempK: 269, orbitAU: 0.0496, inHabitableZone: true },
  { id: "wolf-1061-c", name: "Wolf 1061 c", hostStar: "Wolf 1061",
    starType: "M-dwarf", discoveryMethod: "Radial Velocity", discoveryYear: 2015,
    distancePc: 4.31, radiusEarth: 1.66, massEarth: 4.30, orbitalPeriodDays: 17.87,
    equilibriumTempK: 273, orbitAU: 0.089, inHabitableZone: true },
  { id: "tau-ceti-e", name: "Tau Ceti e", hostStar: "Tau Ceti",
    starType: "G-type", discoveryMethod: "Radial Velocity", discoveryYear: 2017,
    distancePc: 3.65, radiusEarth: 1.81, massEarth: 3.93, orbitalPeriodDays: 162.9,
    equilibriumTempK: 343, orbitAU: 0.538, inHabitableZone: false },
  { id: "tau-ceti-f", name: "Tau Ceti f", hostStar: "Tau Ceti",
    starType: "G-type", discoveryMethod: "Radial Velocity", discoveryYear: 2017,
    distancePc: 3.65, radiusEarth: 1.83, massEarth: 3.93, orbitalPeriodDays: 636.1,
    equilibriumTempK: 220, orbitAU: 1.334, inHabitableZone: true },
  { id: "gj-1061-d", name: "GJ 1061 d", hostStar: "GJ 1061",
    starType: "M-dwarf", discoveryMethod: "Radial Velocity", discoveryYear: 2020,
    distancePc: 3.67, radiusEarth: 1.16, massEarth: 1.64, orbitalPeriodDays: 13.0,
    equilibriumTempK: 218, orbitAU: 0.054, inHabitableZone: true },
  { id: "gj-1132-b", name: "GJ 1132 b", hostStar: "GJ 1132",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2015,
    distancePc: 12.6, radiusEarth: 1.13, massEarth: 1.66, orbitalPeriodDays: 1.63,
    equilibriumTempK: 529, orbitAU: 0.0153, inHabitableZone: false },
  { id: "lhs-1140-b", name: "LHS 1140 b", hostStar: "LHS 1140",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2017,
    distancePc: 14.99, radiusEarth: 1.73, massEarth: 6.98, orbitalPeriodDays: 24.74,
    equilibriumTempK: 235, orbitAU: 0.0936, inHabitableZone: true },
  { id: "gj-667c-c", name: "GJ 667 C c", hostStar: "GJ 667 C",
    starType: "M-dwarf", discoveryMethod: "Radial Velocity", discoveryYear: 2011,
    distancePc: 7.25, radiusEarth: 1.54, massEarth: 3.80, orbitalPeriodDays: 28.14,
    equilibriumTempK: 277, orbitAU: 0.125, inHabitableZone: true },

  // ── TRAPPIST-1 system (7 planets, 12.4 pc) ──
  { id: "trappist-1-b", name: "TRAPPIST-1 b", hostStar: "TRAPPIST-1",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2016,
    distancePc: 12.47, radiusEarth: 1.12, massEarth: 1.37, orbitalPeriodDays: 1.51,
    equilibriumTempK: 391, orbitAU: 0.0115, inHabitableZone: false },
  { id: "trappist-1-c", name: "TRAPPIST-1 c", hostStar: "TRAPPIST-1",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2016,
    distancePc: 12.47, radiusEarth: 1.10, massEarth: 1.31, orbitalPeriodDays: 2.42,
    equilibriumTempK: 335, orbitAU: 0.0158, inHabitableZone: false },
  { id: "trappist-1-d", name: "TRAPPIST-1 d", hostStar: "TRAPPIST-1",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2016,
    distancePc: 12.47, radiusEarth: 0.79, massEarth: 0.39, orbitalPeriodDays: 4.05,
    equilibriumTempK: 282, orbitAU: 0.0223, inHabitableZone: true },
  { id: "trappist-1-e", name: "TRAPPIST-1 e", hostStar: "TRAPPIST-1",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2017,
    distancePc: 12.47, radiusEarth: 0.92, massEarth: 0.69, orbitalPeriodDays: 6.10,
    equilibriumTempK: 251, orbitAU: 0.0293, inHabitableZone: true },
  { id: "trappist-1-f", name: "TRAPPIST-1 f", hostStar: "TRAPPIST-1",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2017,
    distancePc: 12.47, radiusEarth: 1.04, massEarth: 1.04, orbitalPeriodDays: 9.21,
    equilibriumTempK: 219, orbitAU: 0.0385, inHabitableZone: true },
  { id: "trappist-1-g", name: "TRAPPIST-1 g", hostStar: "TRAPPIST-1",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2017,
    distancePc: 12.47, radiusEarth: 1.13, massEarth: 1.32, orbitalPeriodDays: 12.35,
    equilibriumTempK: 199, orbitAU: 0.0469, inHabitableZone: true },
  { id: "trappist-1-h", name: "TRAPPIST-1 h", hostStar: "TRAPPIST-1",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2017,
    distancePc: 12.47, radiusEarth: 0.76, massEarth: 0.33, orbitalPeriodDays: 18.77,
    equilibriumTempK: 173, orbitAU: 0.0619, inHabitableZone: false },

  // ── High-habitability classics ──
  { id: "kepler-442-b", name: "Kepler-442 b", hostStar: "Kepler-442",
    starType: "K-dwarf", discoveryMethod: "Transit", discoveryYear: 2015,
    distancePc: 366.0, radiusEarth: 1.34, massEarth: 2.34, orbitalPeriodDays: 112.3,
    equilibriumTempK: 233, orbitAU: 0.409, inHabitableZone: true },
  { id: "kepler-186-f", name: "Kepler-186 f", hostStar: "Kepler-186",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2014,
    distancePc: 178.5, radiusEarth: 1.17, massEarth: 1.71, orbitalPeriodDays: 129.9,
    equilibriumTempK: 188, orbitAU: 0.40, inHabitableZone: true },
  { id: "kepler-452-b", name: "Kepler-452 b", hostStar: "Kepler-452",
    starType: "G-type", discoveryMethod: "Transit", discoveryYear: 2015,
    distancePc: 551.7, radiusEarth: 1.63, massEarth: 5.0, orbitalPeriodDays: 384.8,
    equilibriumTempK: 265, orbitAU: 1.046, inHabitableZone: true },
  { id: "kepler-1649-c", name: "Kepler-1649 c", hostStar: "Kepler-1649",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2020,
    distancePc: 92.0, radiusEarth: 1.06, massEarth: 1.20, orbitalPeriodDays: 19.5,
    equilibriumTempK: 234, orbitAU: 0.0827, inHabitableZone: true },
  { id: "kepler-22-b", name: "Kepler-22 b", hostStar: "Kepler-22",
    starType: "G-type", discoveryMethod: "Transit", discoveryYear: 2011,
    distancePc: 195.6, radiusEarth: 2.4, massEarth: 9.1, orbitalPeriodDays: 289.9,
    equilibriumTempK: 295, orbitAU: 0.849, inHabitableZone: true },
  { id: "k2-18-b", name: "K2-18 b", hostStar: "K2-18",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2015,
    distancePc: 38.0, radiusEarth: 2.61, massEarth: 8.63, orbitalPeriodDays: 32.94,
    equilibriumTempK: 284, orbitAU: 0.143, inHabitableZone: true },
  { id: "teegarden-b", name: "Teegarden b", hostStar: "Teegarden's Star",
    starType: "M-dwarf", discoveryMethod: "Radial Velocity", discoveryYear: 2019,
    distancePc: 3.83, radiusEarth: 1.02, massEarth: 1.05, orbitalPeriodDays: 4.91,
    equilibriumTempK: 264, orbitAU: 0.0252, inHabitableZone: true },
  { id: "toi-700-d", name: "TOI-700 d", hostStar: "TOI-700",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2020,
    distancePc: 31.13, radiusEarth: 1.07, massEarth: 1.72, orbitalPeriodDays: 37.43,
    equilibriumTempK: 269, orbitAU: 0.163, inHabitableZone: true },

  // ── Recent / TESS-era discoveries ──
  { id: "toi-715-b", name: "TOI-715 b", hostStar: "TOI-715",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2024,
    distancePc: 41.99, radiusEarth: 1.55, massEarth: 3.02, orbitalPeriodDays: 19.29,
    equilibriumTempK: 280, orbitAU: 0.083, inHabitableZone: true },
  { id: "ltt-1445-a-b", name: "LTT 1445 A b", hostStar: "LTT 1445 A",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2019,
    distancePc: 6.86, radiusEarth: 1.30, massEarth: 2.87, orbitalPeriodDays: 5.36,
    equilibriumTempK: 432, orbitAU: 0.0381, inHabitableZone: false },
  { id: "gj-1214-b", name: "GJ 1214 b", hostStar: "GJ 1214",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2009,
    distancePc: 14.65, radiusEarth: 2.74, massEarth: 8.17, orbitalPeriodDays: 1.58,
    equilibriumTempK: 596, orbitAU: 0.0148, inHabitableZone: false },
  { id: "k2-141-b", name: "K2-141 b", hostStar: "K2-141",
    starType: "K-dwarf", discoveryMethod: "Transit", discoveryYear: 2017,
    distancePc: 61.6, radiusEarth: 1.51, massEarth: 5.08, orbitalPeriodDays: 0.28,
    equilibriumTempK: 2039, orbitAU: 0.00716, inHabitableZone: false },
  { id: "gj-486-b", name: "GJ 486 b", hostStar: "GJ 486",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2021,
    distancePc: 8.07, radiusEarth: 1.31, massEarth: 2.82, orbitalPeriodDays: 1.47,
    equilibriumTempK: 700, orbitAU: 0.01734, inHabitableZone: false },
  { id: "gj-3929-b", name: "GJ 3929 b", hostStar: "GJ 3929",
    starType: "M-dwarf", discoveryMethod: "Transit", discoveryYear: 2022,
    distancePc: 15.91, radiusEarth: 1.09, massEarth: 1.21, orbitalPeriodDays: 2.62,
    equilibriumTempK: 569, orbitAU: 0.0252, inHabitableZone: false },

  // ── "Weird" / extreme planets ──
  { id: "55-cancri-e", name: "55 Cancri e", hostStar: "55 Cancri A",
    starType: "G-type", discoveryMethod: "Transit", discoveryYear: 2004,
    distancePc: 12.59, radiusEarth: 1.88, massEarth: 8.08, orbitalPeriodDays: 0.74,
    equilibriumTempK: 2000, orbitAU: 0.01544, inHabitableZone: false },
  { id: "kelt-9-b", name: "KELT-9 b", hostStar: "KELT-9",
    starType: "A-type", discoveryMethod: "Transit", discoveryYear: 2017,
    distancePc: 199.8, radiusEarth: 21.40, massEarth: 891, orbitalPeriodDays: 1.48,
    equilibriumTempK: 4050, orbitAU: 0.0346, inHabitableZone: false },
  { id: "wasp-12-b", name: "WASP-12 b", hostStar: "WASP-12",
    starType: "F-type", discoveryMethod: "Transit", discoveryYear: 2008,
    distancePc: 427.0, radiusEarth: 20.74, massEarth: 459, orbitalPeriodDays: 1.09,
    equilibriumTempK: 2580, orbitAU: 0.0234, inHabitableZone: false },
  { id: "hd-189733-b", name: "HD 189733 b", hostStar: "HD 189733",
    starType: "K-dwarf", discoveryMethod: "Transit", discoveryYear: 2005,
    distancePc: 19.77, radiusEarth: 12.74, massEarth: 363, orbitalPeriodDays: 2.22,
    equilibriumTempK: 1209, orbitAU: 0.0312, inHabitableZone: false },
  { id: "kepler-10-b", name: "Kepler-10 b", hostStar: "Kepler-10",
    starType: "G-type", discoveryMethod: "Transit", discoveryYear: 2011,
    distancePc: 186.1, radiusEarth: 1.47, massEarth: 3.72, orbitalPeriodDays: 0.84,
    equilibriumTempK: 2169, orbitAU: 0.01685, inHabitableZone: false },
  { id: "hd-209458-b", name: "HD 209458 b", hostStar: "HD 209458",
    starType: "G-type", discoveryMethod: "Transit", discoveryYear: 1999,
    distancePc: 48.4, radiusEarth: 15.46, massEarth: 219, orbitalPeriodDays: 3.52,
    equilibriumTempK: 1449, orbitAU: 0.0475, inHabitableZone: false },
  { id: "psr-b1257-b", name: "PSR B1257+12 b", hostStar: "PSR B1257+12",
    starType: "P-type", discoveryMethod: "Pulsar Timing", discoveryYear: 1992,
    distancePc: 710.0, radiusEarth: 0.4, massEarth: 0.020, orbitalPeriodDays: 25.26,
    equilibriumTempK: 80, orbitAU: 0.19, inHabitableZone: false },
  { id: "kepler-16-b", name: "Kepler-16 b", hostStar: "Kepler-16 (AB)",
    starType: "K-dwarf", discoveryMethod: "Transit", discoveryYear: 2011,
    distancePc: 75.8, radiusEarth: 8.45, massEarth: 105.8, orbitalPeriodDays: 228.78,
    equilibriumTempK: 188, orbitAU: 0.7048, inHabitableZone: false },
  { id: "51-pegasi-b", name: "51 Pegasi b", hostStar: "51 Pegasi",
    starType: "G-type", discoveryMethod: "Radial Velocity", discoveryYear: 1995,
    distancePc: 15.61, radiusEarth: 19.16, massEarth: 149.7, orbitalPeriodDays: 4.23,
    equilibriumTempK: 1284, orbitAU: 0.0527, inHabitableZone: false },
];

// Filter PSR B1257+12 b — it's discovered via Pulsar Timing, which is not in
// the controller's allowed list, so it would be invisible. Drop it to keep
// every planet reachable through some constraint.
const FILTERED = RAW.filter((r) => r.discoveryMethod !== "Pulsar Timing");

const planets = FILTERED.map(buildPlanet);

const outPath = join(__dirname, "..", "public", "planets.json");
writeFileSync(outPath, JSON.stringify(planets, null, 2));

console.log(`Wrote ${planets.length} planets → ${outPath}`);
console.log("Distribution:");
const dist = {};
for (const p of planets) dist[p.planetType] = (dist[p.planetType] ?? 0) + 1;
console.log(" ", dist);
const inHZ = planets.filter((p) => p.inHabitableZone).length;
console.log("  In habitable zone:", inHZ);
console.log("  Hab score range:",
  Math.min(...planets.map((p) => p.habitabilityScore)),
  "to",
  Math.max(...planets.map((p) => p.habitabilityScore)));
