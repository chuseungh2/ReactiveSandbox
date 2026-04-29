// src/components/DetailView.jsx
// READS ONLY. No useState. No callbacks coming in. No callbacks going out.
// Receives selectedPlanet, feasibility, missionConstraints — renders them.

import PlanetHero from "./PlanetHero.jsx";
import FeasibilityPanel from "./FeasibilityPanel.jsx";

export default function DetailView({ planet, feasibility, missionConstraints }) {
  if (!planet || !feasibility) {
    return (
      <section className="panel panel--detail" aria-label="Mission detail">
        <div className="panel__scan" aria-hidden />
        <header className="panel__header">
          <h2 className="panel__title">MISSION DETAIL</h2>
        </header>
        <div className="panel__body">
          <div className="empty-state">
            <p>No planet selected.</p>
            <p className="empty-state__hint">Pick a candidate from the catalog.</p>
          </div>
        </div>
      </section>
    );
  }

  const statusKey = feasibility.status.toLowerCase();

  return (
    <section className="panel panel--detail" aria-label="Mission detail">
      <div className="panel__scan" aria-hidden />
      <header className="panel__header">
        <h2 className="panel__title">MISSION DETAIL</h2>
        <span className={`panel__meta panel__meta--${statusKey}`}>
          {planet.discoveryMethod} · {planet.discoveryYear}
        </span>
      </header>

      <div className="panel__body panel__body--scroll">
        {/* Hero — rotating procedural planet + name/host info */}
        <PlanetHero planet={planet} />

        {/* Key metrics */}
        <div className="metrics-grid">
          <Metric label="distance" value={planet.distanceLy.toFixed(1)} unit="ly" />
          <Metric label="radius" value={planet.radiusEarth.toFixed(2)} unit="R⊕" />
          <Metric label="mass" value={planet.massEarth.toFixed(2)} unit="M⊕" />
          <Metric
            label="equilibrium temp"
            value={planet.equilibriumTempC}
            unit="°C"
          />
          <Metric
            label="orbital period"
            value={planet.orbitalPeriodDays.toFixed(1)}
            unit="days"
          />
          <Metric label="orbit" value={planet.orbitAU.toFixed(3)} unit="AU" />
        </div>

        <MissionContext missionConstraints={missionConstraints} />

        {/* THE REACTIVE MOMENT */}
        <FeasibilityPanel feasibility={feasibility} planet={planet} />
      </div>
    </section>
  );
}

function MissionContext({ missionConstraints }) {
  const [minTemp, maxTemp] = missionConstraints.tempRangeC;

  return (
    <section className="mission-context" aria-label="Current mission constraints">
      <span className="mission-context__label">current mission context</span>
      <div className="mission-context__grid">
        <ContextItem label="profile" value={missionConstraints.missionProfile} />
        <ContextItem
          label="max range"
          value={`${missionConstraints.maxDistanceLy} ly`}
        />
        <ContextItem label="temperature" value={`${minTemp}°C to ${maxTemp}°C`} />
        <ContextItem
          label="habitability"
          value={`${missionConstraints.minHabitabilityScore}/100 min`}
        />
        <ContextItem
          label="planet types"
          value={missionConstraints.allowedPlanetTypes.join(", ") || "none"}
        />
        <ContextItem
          label="methods"
          value={missionConstraints.allowedDiscoveryMethods.join(", ") || "none"}
        />
      </div>
    </section>
  );
}

function ContextItem({ label, value }) {
  return (
    <div className="mission-context__item">
      <span className="mission-context__item-label">{label}</span>
      <span className="mission-context__item-value">{value}</span>
    </div>
  );
}

function Metric({ label, value, unit }) {
  return (
    <div className="metric">
      <span className="metric__label">{label}</span>
      <span className="metric__value">
        <span className="mono">{value}</span>
        <span className="metric__unit"> {unit}</span>
      </span>
    </div>
  );
}

// FeasibilityPanel was extracted to its own file so it could carry the
// cinematic "status flip" state machine without polluting DetailView.
// See src/components/FeasibilityPanel.jsx for the animation logic.
