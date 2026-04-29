// src/components/FeasibilityPanel.jsx
// The reactive climax of the system. Receives `feasibility` and `planet`
// from props (no local logic — feasibility is computed in App.jsx) and
// renders the verdict.
//
// On top of the rendering, this component manages a "cinematic flip"
// when the status changes for the *same* planet — i.e. the Scenario C
// moment where the user changes a constraint and the same world's
// verdict tips over. The flip is purely cosmetic; the underlying
// React props are unchanged.
//
// What plays during a flip (~600ms total):
//   • Status text decoded from random chars to the new word (glitchTo)
//   • Score number tweens from old → new (animateNumber)
//   • Each check row catches a ripple wave with stagger (CSS keyframes)
//   • Panel border pulses brighter for one beat (CSS keyframe)
//
// What does NOT trigger a flip:
//   • Initial mount (prev.status is null)
//   • Switching to a different planet (selectedPlanetId changed) — that's
//     navigation, not reactivity, so we snap instantly to the new values.

import { useEffect, useRef, useState } from "react";

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*=▒░";
const GLITCH_MS = 460;     // status text decode length
const SCORE_MS  = 520;     // count-up duration
const FLIP_MS   = 640;     // total panel-flash duration

export default function FeasibilityPanel({ feasibility, planet }) {
  const statusKey = feasibility.status.toLowerCase();

  // ── Displayed values (decoupled from props during the cinematic) ──
  const [displayedScore, setDisplayedScore] = useState(feasibility.score);
  const [displayedStatus, setDisplayedStatus] = useState(feasibility.status);
  const [flipping, setFlipping] = useState(false);

  // ── Tracker for previous state ──
  const prevRef = useRef({ status: null, planetId: null, score: null });

  useEffect(() => {
    const prev = prevRef.current;
    const sameId = prev.planetId === planet.id;
    const statusChanged = prev.status !== feasibility.status;
    const isCinematic = sameId && statusChanged && prev.status !== null;

    let cancelScore = null;
    let cancelGlitch = null;
    let flipTimer = 0;

    if (isCinematic) {
      cancelScore = animateNumber(prev.score, feasibility.score, SCORE_MS, setDisplayedScore);
      cancelGlitch = glitchTo(feasibility.status, GLITCH_MS, setDisplayedStatus);
      setFlipping(true);
      flipTimer = setTimeout(() => setFlipping(false), FLIP_MS);
    } else {
      // Snap, no animation
      setDisplayedScore(feasibility.score);
      setDisplayedStatus(feasibility.status);
      setFlipping(false);
    }

    prevRef.current = {
      status: feasibility.status,
      planetId: planet.id,
      score: feasibility.score,
    };

    return () => {
      if (cancelScore) cancelScore();
      if (cancelGlitch) cancelGlitch();
      if (flipTimer) clearTimeout(flipTimer);
    };
  }, [feasibility.status, feasibility.score, planet.id]);

  return (
    <section
      className={
        "feas feas--" + statusKey + (flipping ? " feas--flipping" : "")
      }
      aria-label="Feasibility under current mission constraints"
    >
      {flipping && <div className="feas__flash" aria-hidden />}
      <header className="feas__header">
        <span className="feas__heading">FEASIBILITY · {planet.name}</span>
      </header>
      <div className="feas__hero">
        <div className={"feas__status feas__status--" + statusKey}>
          {displayedStatus}
        </div>
        <div className="feas__score">
          <span className="mono feas__score-num">{displayedScore}</span>
          <span className="feas__score-denom">/100</span>
        </div>
      </div>
      <ul className="feas__checks">
        {feasibility.checks.map((c) => (
          <li
            key={c.label}
            className={
              "feas__check " +
              (c.pass ? "feas__check--pass" : "feas__check--fail")
            }
          >
            <span className="feas__check-icon" aria-hidden>
              {c.pass ? "✓" : "✗"}
            </span>
            <span className="feas__check-label">{c.label}</span>
            <span className="feas__check-weight mono">+{c.weight}</span>
            <span className="feas__check-detail">{c.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Tween a number from `from` → `to` over `duration` ms (ease-out cubic).
//     Returns a cancel function so React can cleanly stop a mid-flight flip.
function animateNumber(from, to, duration, setter) {
  if (from == null || from === to) {
    setter(to);
    return () => {};
  }
  const start = performance.now();
  let frameId = 0;
  let cancelled = false;
  function tick(now) {
    if (cancelled) return;
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    setter(Math.round(from + (to - from) * eased));
    if (t < 1) frameId = requestAnimationFrame(tick);
  }
  frameId = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    if (frameId) cancelAnimationFrame(frameId);
  };
}

// ─── "Decoder" effect — each character of the target string starts as a
//     random glyph and locks in over time. Reveal probability ramps up
//     between t=0.3 and t=0.85 so the early phase feels chaotic and the
//     end resolves cleanly.
function glitchTo(target, duration, setter) {
  const start = performance.now();
  let frameId = 0;
  let cancelled = false;
  function tick(now) {
    if (cancelled) return;
    const t = Math.min(1, (now - start) / duration);
    if (t >= 1) {
      setter(target);
      return;
    }
    // Reveal probability: 0 until t=0.3, then ramps to 1 by t=0.85
    const revealProb = Math.max(0, Math.min(1, (t - 0.3) / 0.55));
    let out = "";
    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      if (ch === " " || ch === "-") {
        out += ch;
      } else if (Math.random() < revealProb) {
        out += ch;
      } else {
        out += GLITCH_CHARS[(Math.random() * GLITCH_CHARS.length) | 0];
      }
    }
    setter(out);
    frameId = requestAnimationFrame(tick);
  }
  frameId = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    if (frameId) cancelAnimationFrame(frameId);
  };
}
