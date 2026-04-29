// src/logic/planetTexture.js
// Procedural 2D texture generation for the rotating planet hero.
// Each planetType gets its own palette + noise treatment. Output is an
// equirectangular texture (width = 2 × height) that PlanetHero samples
// per-pixel with spherical UV mapping to fake a rotating 3D sphere.

// ── Tiny seedable RNG so the same planet always renders the same texture ──
function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Value-noise: cheap and good enough for planetary textures.
function makeNoise(seed) {
  const rand = mulberry32(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = new Float32Array(256);
  for (let i = 0; i < 256; i++) grad[i] = rand() * 2 - 1;

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  return function noise2D(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = grad[perm[(xi    ) + perm[(yi    )]] & 255];
    const ba = grad[perm[(xi + 1) + perm[(yi    )]] & 255];
    const ab = grad[perm[(xi    ) + perm[(yi + 1)]] & 255];
    const bb = grad[perm[(xi + 1) + perm[(yi + 1)]] & 255];
    return lerp(lerp(aa, ba, u), lerp(ab, bb, u), v); // -1..1
  };
}

function fbm(noise, x, y, octaves) {
  let total = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise(x * freq, y * freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / max; // -1..1
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function mixRGB(c1, c2, t) {
  return [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t),
  ];
}

// ── Public: per-type atmosphere color used by the outer glow ring ──
export function getPlanetVisuals(type) {
  switch (type) {
    case "rocky":
      return { atmosphereColor: "rgba(255, 165, 90, 0.32)" };
    case "super-earth":
      return { atmosphereColor: "rgba(110, 190, 255, 0.45)" };
    case "mini-neptune":
      return { atmosphereColor: "rgba(120, 220, 235, 0.42)" };
    case "gas-giant":
      return { atmosphereColor: "rgba(255, 195, 130, 0.45)" };
    default:
      return { atmosphereColor: "rgba(0, 229, 255, 0.32)" };
  }
}

// ── Public: build an equirectangular RGBA texture for a planet ──
// Returns { data: Uint8ClampedArray, width, height }.
export function generatePlanetTexture(planet) {
  const W = 512;
  const H = 256;
  const seed = hashString(planet.id || planet.name || "exoplanet");
  const noise = makeNoise(seed);
  const data = new Uint8ClampedArray(W * H * 4);
  const type = planet.planetType;

  for (let y = 0; y < H; y++) {
    const lat = (y / H - 0.5) * 2; // -1 (south) .. 1 (north)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const nx = (x / W) * 8;
      const ny = (y / H) * 4;

      let r = 0, g = 0, b = 0;

      if (type === "rocky") {
        // Brown/gray cratered surface — fbm + a sparser layer of dark spots
        const base = (fbm(noise, nx * 1.4, ny * 1.4, 5) + 1) * 0.5;
        const crater = Math.max(0, fbm(noise, nx * 7 + 91, ny * 7 + 91, 2)) * 0.5;
        const v = clamp(base - crater, 0, 1);
        const dark = [55, 45, 38];
        const mid  = [120, 96, 72];
        const lite = [180, 152, 116];
        const c = v < 0.5
          ? mixRGB(dark, mid, v * 2)
          : mixRGB(mid, lite, (v - 0.5) * 2);
        [r, g, b] = c;
      }

      else if (type === "super-earth") {
        // Earth-like: deep ocean → coast → land → highlands → polar caps + clouds
        const elev = fbm(noise, nx * 1.2, ny * 1.2, 6); // -1..1
        const cloud = (fbm(noise, nx * 2.4 + 50, ny * 2.4 + 50, 3) + 1) * 0.5;

        let base;
        if (elev < -0.05) {
          const depth = clamp((elev + 1) / 0.95, 0, 1);
          base = mixRGB([14, 30, 75], [40, 95, 175], depth);
        } else if (elev < 0) {
          base = mixRGB([40, 95, 175], [85, 145, 200], (elev + 0.05) * 20);
        } else if (elev < 0.35) {
          base = mixRGB([55, 110, 50], [130, 150, 80], elev / 0.35);
        } else {
          base = mixRGB([130, 150, 80], [225, 222, 215], clamp((elev - 0.35) / 0.4, 0, 1));
        }
        // Polar caps soften toward the poles
        const polar = Math.max(0, Math.abs(lat) - 0.78) * 4.5;
        base = mixRGB(base, [240, 245, 250], clamp(polar, 0, 1));
        // Clouds — only above a threshold
        const cloudT = clamp((cloud - 0.55) * 3, 0, 1);
        const out = mixRGB(base, [245, 248, 252], cloudT * 0.7);
        [r, g, b] = out;
      }

      else if (type === "mini-neptune") {
        // Soft horizontal teal/cyan bands with light wave perturbation
        const wave = Math.sin((x / W) * Math.PI * 8 + lat * 4) * 0.05;
        const band = (Math.sin((lat + wave) * Math.PI * 5) + 1) * 0.5;
        const detail = (fbm(noise, nx * 4, ny * 8, 3) + 1) * 0.5;
        const v = clamp(band * 0.7 + detail * 0.3, 0, 1);
        [r, g, b] = mixRGB([18, 70, 105], [120, 225, 240], v);
      }

      else if (type === "gas-giant") {
        // Strong Jupiter-style horizontal bands + turbulence + a single big spot
        const wave = Math.sin((x / W) * Math.PI * 6 + lat * 8) * 0.04;
        const band = (Math.sin((lat + wave) * Math.PI * 7) + 1) * 0.5;
        const turb = (fbm(noise, nx * 6, ny * 4, 4) + 1) * 0.5;
        const v = clamp(band * 0.65 + turb * 0.35, 0, 1);
        const c1 = [120, 70, 35];
        const c2 = [205, 155, 100];
        const c3 = [240, 215, 175];
        let c = v < 0.5 ? mixRGB(c1, c2, v * 2) : mixRGB(c2, c3, (v - 0.5) * 2);
        // Great red spot, stretched ellipse near 60% lon, lower mid-latitude
        const dxs = ((x / W) - 0.6);
        const dys = ((y / H) - 0.62);
        const spotR = Math.sqrt(dxs * dxs * 4 + dys * dys * 9);
        if (spotR < 0.13) {
          c = mixRGB(c, [185, 70, 50], (1 - spotR / 0.13) * 0.85);
        }
        [r, g, b] = c;
      }

      else {
        // Unknown — neutral cyan-tinted gray
        const v = (fbm(noise, nx, ny, 4) + 1) * 0.5;
        [r, g, b] = mixRGB([40, 50, 70], [150, 170, 200], v);
      }

      data[i]     = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  return { data, width: W, height: H };
}
