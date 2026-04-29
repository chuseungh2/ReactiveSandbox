// src/components/Controller.jsx
// Reads missionConstraints (from props). Writes via onConstraintsChange(next).
// NO local useState for the constraint values themselves — they live in App.

import {
  ALL_PLANET_TYPES,
  ALL_DISCOVERY_METHODS,
  PROFILE_DESCRIPTIONS,
} from "../data/missionPresets.js";

const PROFILES = ["crewed", "probe", "observation"];

export default function Controller({
  missionConstraints,
  matchCount,
  totalCount,
  onConstraintsChange,
  onProfileChange,
}) {
  const c = missionConstraints;

  // Helper to patch one field on the constraints object and bubble up.
  function patch(field, value) {
    onConstraintsChange({ ...c, [field]: value });
  }

  function toggleArrayField(field, value) {
    const set = new Set(c[field]);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onConstraintsChange({ ...c, [field]: Array.from(set) });
  }

  return (
    <section className="panel panel--controller" aria-label="Mission controller">
      <div className="panel__scan" aria-hidden />
      <header className="panel__header">
        <h2 className="panel__title">CONTROLLER</h2>
        <span className="panel__meta">
          mission parameters
        </span>
      </header>

      <div className="panel__body panel__body--scroll">
        {/* Mission profile toggle */}
        <ControlGroup label="Mission profile">
          <div className="profile-toggle" role="radiogroup" aria-label="Mission profile">
            {PROFILES.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={c.missionProfile === p}
                className={
                  "profile-toggle__btn" +
                  (c.missionProfile === p ? " profile-toggle__btn--active" : "")
                }
                onClick={() => onProfileChange(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="control-hint control-hint--profile">
            {PROFILE_DESCRIPTIONS[c.missionProfile]}
          </p>
        </ControlGroup>

        {/* Max distance slider */}
        <ControlGroup
          label="Max distance"
          valueDisplay={
            <>
              <span className="mono">{c.maxDistanceLy}</span> ly
            </>
          }
        >
          <input
            type="range"
            min={10}
            max={1500}
            step={10}
            value={c.maxDistanceLy}
            onChange={(e) => patch("maxDistanceLy", Number(e.target.value))}
            className="slider"
            aria-label="Maximum mission distance in light years"
          />
          <div className="slider__scale">
            <span>10 ly</span>
            <span>1500 ly</span>
          </div>
        </ControlGroup>

        {/* Temperature dual slider */}
        <ControlGroup
          label="Temperature range"
          valueDisplay={
            <>
              <span className="mono">{c.tempRangeC[0]}</span>°C to{" "}
              <span className="mono">{c.tempRangeC[1]}</span>°C
            </>
          }
        >
          <div className="dual-slider">
            <input
              type="range"
              min={-200}
              max={200}
              step={5}
              value={c.tempRangeC[0]}
              onChange={(e) => {
                const lo = Number(e.target.value);
                const hi = Math.max(lo, c.tempRangeC[1]);
                patch("tempRangeC", [lo, hi]);
              }}
              className="slider"
              aria-label="Minimum survivable temperature"
            />
            <input
              type="range"
              min={-200}
              max={200}
              step={5}
              value={c.tempRangeC[1]}
              onChange={(e) => {
                const hi = Number(e.target.value);
                const lo = Math.min(c.tempRangeC[0], hi);
                patch("tempRangeC", [lo, hi]);
              }}
              className="slider"
              aria-label="Maximum survivable temperature"
            />
          </div>
          <div className="slider__scale">
            <span>-200°C</span>
            <span>+200°C</span>
          </div>
        </ControlGroup>

        {/* Planet types */}
        <ControlGroup label="Planet types allowed">
          <div className="checkbox-grid">
            {ALL_PLANET_TYPES.map((t) => (
              <label key={t} className="check">
                <input
                  type="checkbox"
                  checked={c.allowedPlanetTypes.includes(t)}
                  onChange={() => toggleArrayField("allowedPlanetTypes", t)}
                />
                <span className="check__label">{t}</span>
              </label>
            ))}
          </div>
        </ControlGroup>

        {/* Habitability slider */}
        <ControlGroup
          label="Min habitability"
          valueDisplay={
            <>
              <span className="mono">{c.minHabitabilityScore}</span>/100
            </>
          }
        >
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={c.minHabitabilityScore}
            onChange={(e) => patch("minHabitabilityScore", Number(e.target.value))}
            className="slider"
            aria-label="Minimum habitability score"
          />
          <div className="slider__scale">
            <span>0</span>
            <span>100</span>
          </div>
        </ControlGroup>

        {/* Discovery methods */}
        <ControlGroup label="Discovery methods">
          <div className="checkbox-grid">
            {ALL_DISCOVERY_METHODS.map((m) => (
              <label key={m} className="check">
                <input
                  type="checkbox"
                  checked={c.allowedDiscoveryMethods.includes(m)}
                  onChange={() => toggleArrayField("allowedDiscoveryMethods", m)}
                />
                <span className="check__label">{m}</span>
              </label>
            ))}
          </div>
        </ControlGroup>

        {/* Live readout */}
        <div className={"summary-readout" + (matchCount === 0 ? " summary-readout--warn" : "")}>
          <span className="summary-readout__label">CANDIDATES</span>
          <span className="summary-readout__value">
            <span className="mono">{matchCount}</span>
            <span className="summary-readout__divider">of</span>
            <span className="mono">{totalCount}</span>
          </span>
          {matchCount === 0 ? (
            <span className="summary-readout__warn">No planets match — relax constraints.</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ControlGroup({ label, valueDisplay, children }) {
  return (
    <div className="control-group">
      <div className="control-group__header">
        <span className="control-group__label">{label}</span>
        {valueDisplay ? (
          <span className="control-group__value">{valueDisplay}</span>
        ) : null}
      </div>
      <div className="control-group__body">{children}</div>
    </div>
  );
}
