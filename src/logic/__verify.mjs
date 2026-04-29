// Quick sanity checks for the feasibility logic + scenario reactivity.
// Run with `node src/logic/__verify.mjs` from the project root.

import { calculateFeasibility } from "./feasibility.js";
import { STARTER_PLANETS } from "../data/starterPlanets.js";
import { MISSION_PRESETS } from "../data/missionPresets.js";

let pass = 0, fail = 0;
function check(label, cond) {
  if (cond) { pass++; console.log("  ✓", label); }
  else { fail++; console.log("  ✗", label); }
}

console.log("─".repeat(60));
console.log("SCENARIO B/C — Kepler-442 b feasibility under crewed profile");
console.log("─".repeat(60));
const kepler = STARTER_PLANETS.find(p => p.id === "kepler-442-b");
const crewed = MISSION_PRESETS.crewed;
const f1 = calculateFeasibility(kepler, crewed);
console.log("  status:", f1.status, "score:", f1.score);
// Kepler-442b: 1194 ly (>100 fail), -40°C (within -20..50? NO fail), rocky pass,
//              hab 83 (>=50 pass), inHZ pass.
// Pass: type 20 + hab 15 + HZ 10 = 45 → NO-GO
check("Distance check fails (1194 ly > 100 ly)",
  f1.checks.find(c => c.label.startsWith("Distance")).pass === false);
check("Status is NO-GO with crewed profile", f1.status === "NO-GO");

console.log("");
console.log("─".repeat(60));
console.log("SCENARIO B — same planet, switched to observation profile");
console.log("─".repeat(60));
const f2 = calculateFeasibility(kepler, MISSION_PRESETS.observation);
console.log("  status:", f2.status, "score:", f2.score);
// Observation: 1500ly OK, [-200..200] OK, rocky allowed, hab 83 >=0, inHZ.
// All 5 pass → 100 → GO
check("All checks pass under observation", f2.checks.every(c => c.pass));
check("Status flips to GO", f2.status === "GO");
check("Score is 100", f2.score === 100);

console.log("");
console.log("─".repeat(60));
console.log("SCENARIO C — Kepler-442 b: narrow temp range flips a single check");
console.log("─".repeat(60));
const narrowTemp = { ...MISSION_PRESETS.observation, tempRangeC: [-10, 30] };
const f3 = calculateFeasibility(kepler, narrowTemp);
console.log("  status:", f3.status, "score:", f3.score);
// Now temp -40 is outside [-10,30] → temp check fails (lose 25)
// 100 - 25 = 75 → CAUTION
check("Temperature check now fails",
  f3.checks.find(c => c.label.startsWith("Temperature")).pass === false);
check("Score drops by exactly the temp weight (25)", f3.score === 75);
check("Status drops to CAUTION", f3.status === "CAUTION");

console.log("");
console.log("─".repeat(60));
console.log("SCENARIO A — feasibility is pure: same input → same output");
console.log("─".repeat(60));
const a = calculateFeasibility(kepler, crewed);
const b = calculateFeasibility(kepler, crewed);
check("Pure function — repeatable", JSON.stringify(a) === JSON.stringify(b));

console.log("");
console.log("─".repeat(60));
console.log("PROXIMA CEN B feasibility");
console.log("─".repeat(60));
const prox = STARTER_PLANETS.find(p => p.id === "proxima-cen-b");
// Crewed: it's only 4.24 ly (pass) but -39°C (fails the [-20, 50] check).
// That's the kind of partial-fit moment we want the system to surface.
const fpCrewed = calculateFeasibility(prox, crewed);
console.log("  crewed →", fpCrewed.status, fpCrewed.score);
check("Proxima Cen b is CAUTION under crewed (too cold)",
  fpCrewed.status === "CAUTION" && fpCrewed.score === 75);

// Probe: temp range expands to [-100, 150], so the temp check now passes.
const fpProbe = calculateFeasibility(prox, MISSION_PRESETS.probe);
console.log("  probe  →", fpProbe.status, fpProbe.score);
check("Proxima Cen b flips to GO under probe profile",
  fpProbe.status === "GO" && fpProbe.score === 100);

console.log("");
console.log("─".repeat(60));
console.log(`TOTAL: ${pass} passed, ${fail} failed`);
console.log("─".repeat(60));
process.exit(fail > 0 ? 1 : 0);
