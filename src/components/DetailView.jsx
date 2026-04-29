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

function EarthComparison({ radiusEarth, planetName }) {
  // Sizes are in SVG units. Earth = 24, planet scales relative to it.
  // Cap visual size so a hot-Jupiter-scale gas giant doesn't blow out the layout.
  const earthR = 24;
  const rawPlanetR = earthR * radiusEarth;
  const planetR = Math.min(rawPlanetR, 80);
  const totalWidth = 240;
  const totalHeight = 130;
  const earthCx = 60;
  const planetCx = 170;
  const cy = 70;

  return (
    <div className="earth-compare">
      <span className="earth-compare__label">size vs. Earth</span>
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="earth-compare__svg"
        role="img"
        aria-label={`${planetName} radius compared to Earth`}
      >
        <defs>
          <radialGradient id="earth-gradient" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#7AB7FF" />
            <stop offset="60%" stopColor="#2C5AAA" />
            <stop offset="100%" stopColor="#0A1F4A" />
          </radialGradient>
          <radialGradient id="planet-gradient" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#9BFFFF" />
            <stop offset="55%" stopColor="#00B8D9" />
            <stop offset="100%" stopColor="#003B5C" />
          </radialGradient>
          <filter id="planet-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={earthCx} cy={cy} r={earthR} className="earth-compare__earth" filter="url(#planet-glow)" />
        <circle cx={planetCx} cy={cy} r={planetR} className="earth-compare__planet" filter="url(#planet-glow)" />
        {/* highlight specular to suggest a lit hemisphere */}
        <circle cx={earthCx - earthR * 0.35} cy={cy - earthR * 0.35} r={earthR * 0.25}
                fill="rgba(255,255,255,0.35)" />
        <circle cx={planetCx - planetR * 0.35} cy={cy - planetR * 0.35} r={planetR * 0.25}
                fill="rgba(255,255,255,0.4)" />
        <text x={earthCx} y={cy + earthR + 22} textAnchor="middle" className="earth-compare__text">
          Earth
        </text>
        <text x={planetCx} y={cy + planetR + 22} textAnchor="middle" className="earth-compare__text">
          {radiusEarth.toFixed(2)}× R⊕
        </text>
      </svg>
    </div>
  );
}

// FeasibilityPanel was extracted to its own file so it could carry the
// cinematic "status flip" state machine without polluting DetailView.
// See src/components/FeasibilityPanel.jsx for the animation logic.
