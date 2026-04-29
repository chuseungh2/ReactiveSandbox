// src/components/Header.jsx
// Top mission-control bar. Reads only — pure presentation.

export default function Header({ totalPlanets, matchingPlanets, missionProfile }) {
  return (
    <header className="header">
      <div className="header__scan" aria-hidden />
      <div className="header__brand">
        <span className="header__sigil" aria-hidden>◈</span>
        <div className="header__title">
          <h1>PROJECT EXODUS</h1>
          <span className="header__subtitle">Mission Planner · Bridge Console</span>
        </div>
      </div>
      <div className="header__readout">
        <div className="readout">
          <span className="readout__label">profile</span>
          <span className="readout__value">{missionProfile}</span>
        </div>
        <div className="readout">
          <span className="readout__label">candidates</span>
          <span className="readout__value">
            <span className="mono">{matchingPlanets}</span>
            <span className="readout__divider">/</span>
            <span className="mono readout__muted">{totalPlanets}</span>
          </span>
        </div>
        <div className="readout readout--status">
          <span className="readout__pulse" aria-hidden />
          <span className="readout__label">live</span>
        </div>
      </div>
    </header>
  );
}
