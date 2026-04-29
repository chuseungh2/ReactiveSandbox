// src/logic/feasibility.js
// Pure function: given a planet and the current mission constraints,
// returns { score, status, checks }. NO React state, NO side effects.
// This is the intellectual core of Project Exodus.

export function calculateFeasibility(planet, constraints) {
  const checks = [
    {
      label: "Distance within mission range",
      pass: planet.distanceLy <= constraints.maxDistanceLy,
      weight: 30,
      detail: `${planet.distanceLy.toFixed(1)} ly · limit ${constraints.maxDistanceLy} ly`,
    },
    {
      label: "Temperature survivable",
      pass:
        planet.equilibriumTempC >= constraints.tempRangeC[0] &&
        planet.equilibriumTempC <= constraints.tempRangeC[1],
      weight: 25,
      detail: `${planet.equilibriumTempC}°C · range [${constraints.tempRangeC[0]}, ${constraints.tempRangeC[1]}]`,
    },
    {
      label: "Planet type compatible with mission",
      pass: constraints.allowedPlanetTypes.includes(planet.planetType),
      weight: 20,
      detail: `${planet.planetType} · allowed: ${constraints.allowedPlanetTypes.join(", ") || "none"}`,
    },
    {
      label: "Habitability above threshold",
      pass: planet.habitabilityScore >= constraints.minHabitabilityScore,
      weight: 15,
      detail: `${planet.habitabilityScore} · min ${constraints.minHabitabilityScore}`,
    },
    {
      label: "In stellar habitable zone",
      pass: planet.inHabitableZone === true,
      weight: 10,
      detail: planet.inHabitableZone ? "yes" : "no",
    },
  ];

  const score = checks
    .filter((c) => c.pass)
    .reduce((sum, c) => sum + c.weight, 0);

  const status = score >= 80 ? "GO" : score >= 50 ? "CAUTION" : "NO-GO";

  return { score, status, checks };
}

// Used by the Browser/Controller candidate count to decide whether a planet
// should stay visible in the current mission context. GO and CAUTION remain
// visible so the user can compare strong and partial fits; NO-GO worlds drop
// out of the active candidate list.
export function passesHardFilters(planet, constraints) {
  return (
    constraints.allowedDiscoveryMethods.includes(planet.discoveryMethod) &&
    calculateFeasibility(planet, constraints).status !== "NO-GO"
  );
}
