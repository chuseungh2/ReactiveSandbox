// src/data/missionPresets.js
// Mission profile presets. When the user toggles missionProfile in the
// Controller, the other constraints snap to these defaults. The user
// can still override any value afterward.

export const MISSION_PRESETS = {
  crewed: {
    missionProfile: "crewed",
    maxDistanceLy: 100,
    tempRangeC: [-20, 50],
    allowedPlanetTypes: ["rocky", "super-earth"],
    minHabitabilityScore: 50,
    allowedDiscoveryMethods: [
      "Transit",
      "Radial Velocity",
      "Direct Imaging",
      "Microlensing",
    ],
  },
  probe: {
    missionProfile: "probe",
    maxDistanceLy: 500,
    tempRangeC: [-100, 150],
    allowedPlanetTypes: ["rocky", "super-earth", "mini-neptune"],
    minHabitabilityScore: 20,
    allowedDiscoveryMethods: [
      "Transit",
      "Radial Velocity",
      "Direct Imaging",
      "Microlensing",
    ],
  },
  observation: {
    missionProfile: "observation",
    maxDistanceLy: 1500,
    tempRangeC: [-200, 200],
    allowedPlanetTypes: ["rocky", "super-earth", "mini-neptune", "gas-giant"],
    minHabitabilityScore: 0,
    allowedDiscoveryMethods: [
      "Transit",
      "Radial Velocity",
      "Direct Imaging",
      "Microlensing",
    ],
  },
};

// Human-readable description shown under the profile toggle. Tells the
// user what philosophy each preset embodies, so the snap-to-defaults
// behavior makes sense at a glance.
export const PROFILE_DESCRIPTIONS = {
  crewed:      "Protect the operator — short range, narrow temp, rocky worlds only.",
  probe:       "Extend reach — durable hardware tolerates harsher worlds.",
  observation: "Telescope only — no landing required, every candidate eligible.",
};

export const DEFAULT_PROFILE = "crewed";

export const DEFAULT_CONSTRAINTS = MISSION_PRESETS[DEFAULT_PROFILE];

export const ALL_PLANET_TYPES = [
  "rocky",
  "super-earth",
  "mini-neptune",
  "gas-giant",
];

export const ALL_DISCOVERY_METHODS = [
  "Transit",
  "Radial Velocity",
  "Direct Imaging",
  "Microlensing",
];

export const PLANET_TYPE_ICON = {
  rocky: "●",
  "super-earth": "●",
  "mini-neptune": "●",
  "gas-giant": "●",
};
