// src/components/PlanetHero.jsx
// A rotating procedural planet rendered to a 2D canvas.
//
// Per pixel inside the sphere we compute (u, v) by inverse spherical
// projection of the screen coordinate, sample the equirectangular
// texture at that point + the running rotation offset, and apply
// Lambertian shading so the lit hemisphere reads as 3D. The lookup
// of "screen pixel → (lon, lat, lightDot)" is precomputed once per
// canvas size so the per-frame cost is just a texture sample +
// shading multiply per pixel.
//
// Reads only — no shared state, no callbacks. Pure presentation.

import { useEffect, useRef } from "react";
import {
  generatePlanetTexture,
  getPlanetVisuals,
} from "../logic/planetTexture.js";

const CANVAS_SIZE = 200;          // square canvas (CSS px == device px here)
const ROTATION_PERIOD_S = 60;     // one full revolution in seconds
const REDUCED_FPS = 30;           // cap to keep CPU low — planets rotate slowly anyway

export default function PlanetHero({ planet }) {
  const canvasRef = useRef(null);
  const textureRef = useRef(null);
  const rotationRef = useRef(0);
  const mapRef = useRef(null);
  const rafRef = useRef(0);

  // ── Precompute the per-pixel sphere lookup once per canvas size ──
  useEffect(() => {
    const size = CANVAS_SIZE;
    const r = size / 2;
    // For each pixel: [lon, v, lightDot, inSphere]
    const map = new Float32Array(size * size * 4);
    // Light direction (normalized) — upper-left, slightly behind viewer
    const Lx = -0.40;
    const Ly = -0.40;
    const Lz =  0.825; // sqrt(1 - 0.4² - 0.4²) ≈ 0.824
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dx = (x + 0.5 - r) / r;
        const dy = (y + 0.5 - r) / r;
        const r2 = dx * dx + dy * dy;
        if (r2 >= 1) {
          map[idx + 3] = 0;
          continue;
        }
        const dz = Math.sqrt(1 - r2);
        // Spherical coords. Rotation is added per frame by adjusting lon.
        const lon = Math.atan2(dx, dz);    // -π..π
        const lat = Math.asin(dy);          // -π/2..π/2
        const v = lat / Math.PI + 0.5;     // 0..1 vertical texture coord
        // Lambertian + soft ambient
        const ndotl = dx * Lx + dy * Ly + dz * Lz;
        const lightDot = Math.max(0, ndotl);
        const ambient = 0.18;
        const shading = ambient + (1 - ambient) * lightDot;
        map[idx]     = lon;
        map[idx + 1] = v;
        map[idx + 2] = shading;
        map[idx + 3] = 1;
      }
    }
    mapRef.current = map;
  }, []);

  // ── Regenerate the procedural texture whenever planet identity changes ──
  useEffect(() => {
    if (!planet) return;
    textureRef.current = generatePlanetTexture(planet);
    rotationRef.current = 0; // restart rotation from a clean angle
  }, [planet?.id, planet?.planetType]);

  // ── Animation loop ──
  useEffect(() => {
    if (!planet) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = CANVAS_SIZE;

    // Honor reduced motion: keep planet shaded, but skip the rotation.
    const reducedMotion = typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lastFrameTime = performance.now();
    let lastDrawTime = lastFrameTime;
    const frameMs = 1000 / REDUCED_FPS;

    function frame(now) {
      const dt = Math.min(50, now - lastFrameTime);
      lastFrameTime = now;
      if (!reducedMotion) {
        rotationRef.current += (dt / 1000) * ((Math.PI * 2) / ROTATION_PERIOD_S);
      }
      // Throttle to REDUCED_FPS — saves CPU on a 60Hz screen
      if (now - lastDrawTime >= frameMs) {
        lastDrawTime = now;
        draw(ctx, size);
      }
      rafRef.current = requestAnimationFrame(frame);
    }

    function draw(ctx, size) {
      const tex = textureRef.current;
      const map = mapRef.current;
      if (!tex || !map) return;

      const tw = tex.width;
      const th = tex.height;
      const tdata = tex.data;
      const rot = rotationRef.current;
      const TWO_PI = Math.PI * 2;

      const imgData = ctx.createImageData(size, size);
      const out = imgData.data;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const mi = i; // map and out are same shape
          if (map[mi + 3] === 0) {
            // Outside sphere — leave fully transparent
            continue;
          }
          // Wrap longitude with rotation, sample texture
          let u = (map[mi] + rot) / TWO_PI;
          u -= Math.floor(u);
          const v = map[mi + 1];
          const tx = (u * tw) | 0;
          const ty = (v * th) | 0;
          const ti = (ty * tw + tx) * 4;
          const sh = map[mi + 2];
          out[i]     = tdata[ti]     * sh;
          out[i + 1] = tdata[ti + 1] * sh;
          out[i + 2] = tdata[ti + 2] * sh;
          out[i + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [planet?.id]);

  if (!planet) return null;
  const visuals = getPlanetVisuals(planet.planetType);

  return (
    <div className="planet-hero">
      <div
        className="planet-hero__sphere"
        style={{ "--atm": visuals.atmosphereColor }}
        aria-hidden
      >
        <div className="planet-hero__atmosphere" />
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="planet-hero__canvas"
        />
        <div className="planet-hero__rim" />
      </div>
      <div className="planet-hero__info">
        <h3 className="planet-hero__name">{planet.name}</h3>
        <div className="planet-hero__meta">
          <span>{planet.hostStar}</span>
          <span className="planet-hero__sep">·</span>
          <span>{planet.starType}</span>
        </div>
        <div
          className={
            "planet-hero__zone " +
            (planet.inHabitableZone ? "planet-hero__zone--ok" : "planet-hero__zone--muted")
          }
        >
          {planet.inHabitableZone ? "✓ in habitable zone" : "outside HZ"}
        </div>
        <div className="planet-hero__type">
          <span className="planet-hero__type-label">classification</span>
          <span className="planet-hero__type-value">{planet.planetType}</span>
        </div>
      </div>
    </div>
  );
}
