// src/components/Browser.jsx
// Reads filteredPlanets, selectedPlanetId, feasibilityByPlanetId.
// Writes via onSelectPlanet(id). No internal state for shared data.

import { PLANET_TYPE_ICON } from "../data/missionPresets.js";

export default function Browser({
  planets,
  allPlanetCount,
  selectedPlanetId,
  feasibilityByPlanetId,
  onSelectPlanet,
}) {
  return (
    <section className="panel panel--browser" aria-label="Planet catalog">
      <div className="panel__scan" aria-hidden />
      <header className="panel__header">
        <h2 className="panel__title">CATALOG</h2>
        <span className="panel__meta">
          <span className="mono">{planets.length}</span> match
          <span className="panel__meta-divider">·</span>
          <span className="mono">{allPlanetCount}</span> total
        </span>
      </header>

      <div className="panel__body panel__body--scroll">
        {planets.length === 0 ? (
          <div className="empty-state">
            <p>No planets match your current mission constraints.</p>
            <p className="empty-state__hint">Loosen distance, temperature, or planet type in the Controller.</p>
          </div>
        ) : (
          <ul className="card-list">
            {planets.map((planet) => {
              const feas = feasibilityByPlanetId[planet.id];
              const status = feas?.status ?? "NO-GO";
              const score = feas?.score ?? 0;
              const isSelected = planet.id === selectedPlanetId;
              return (
                <li key={planet.id}>
                  <button
                    type="button"
                    className={
                      "planet-card" +
                      (isSelected ? " planet-card--selected" : "") +
                      ` planet-card--${status.toLowerCase()}`
                    }
                    onClick={() => onSelectPlanet(planet.id)}
                  >
                    <div className="planet-card__row">
                      <span
                        className="planet-card__icon"
                        aria-hidden
                        title={planet.planetType}
                      >
                        {PLANET_TYPE_ICON[planet.planetType] ?? "●"}
                      </span>
                      <span className="planet-card__name">{planet.name}</span>
                      <span
                        className={`badge badge--${status.toLowerCase()}`}
                        aria-label={`Feasibility ${status} ${score} of 100`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="planet-card__row planet-card__row--meta">
                      <span className="planet-card__star">{planet.hostStar}</span>
                      <span className="planet-card__metrics">
                        <span className="mono">{planet.distanceLy.toFixed(1)}</span>{" "}
                        <span className="planet-card__unit">ly</span>
                        <span className="planet-card__divider">·</span>
                        <span
                          className="planet-card__sparkline"
                          aria-label={`${feas?.checks.filter(c => c.pass).length ?? 0} of 5 checks pass`}
                        >
                          {feas?.checks.map((c) => (
                            <span
                              key={c.label}
                              className={
                                "planet-card__spark-dot " +
                                (c.pass
                                  ? "planet-card__spark-dot--pass"
                                  : "planet-card__spark-dot--fail")
                              }
                              title={`${c.label}: ${c.pass ? "PASS" : "FAIL"}`}
                            />
                          ))}
                        </span>
                        <span className="planet-card__divider">·</span>
                        <span className="mono">{score}</span>
                        <span className="planet-card__unit">/100</span>
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
