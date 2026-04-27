# ReactiveSandbox

A sandbox for exploring reactive programming patterns.

## Design Intent

> *This was written before starting implementation.*

---

### 1. Domain & Why

I chose an exoplanet mission planning system because it naturally fits the three-panel structure required for this project.

There is a clear separation:
- a list of planets to explore (Browser),
- a focused view of one planet (Detail),
- and a set of controls that change the context (Controller).

What made this idea interesting to me is that it is not just filtering data. I wanted the system to feel like a decision-making tool, where changing the mission conditions actually changes how the same planet is evaluated. This makes the connection between panels much more visible and meaningful.

---

### 2. Data Model (JSON Shape)

All shared state lives in the App component. I kept the structure simple at first so I can clearly control how state flows between components.

```js
{
  planets: [ /* loaded from planets.json */ ],

  selectedPlanetId: "kepler-442-b",

  missionConstraints: {
    missionProfile: "crewed",
    maxDistanceLy: 100,
    tempRangeC: [-20, 50],
    allowedPlanetTypes: ["rocky", "super-earth"],
    minHabitabilityScore: 50,
    allowedDiscoveryMethods: ["Transit", "Radial Velocity", "Direct Imaging"]
  }
}
```

Some values like filtered planets and feasibility scores are not stored as state. Instead, they are calculated from the existing data. I made this decision to avoid having multiple sources of truth and to keep the system predictable.

---

### 3. The Three Panels

**Browser (left)**
The Browser shows a list of planets. Each item includes basic information like name, distance, and a feasibility status based on current conditions. When a planet is clicked, it updates the selected planet in the App.

**Detail View (middle)**
The Detail View displays information about the currently selected planet. This includes key data and a feasibility breakdown showing whether the planet is a GO, CAUTION, or NO-GO. This panel does not manage its own state — it only reflects what it receives from the App.

**Controller (right)**
The Controller allows the user to change mission conditions such as distance, temperature range, and allowed planet types. When a control is changed, it updates the shared state, which causes the other panels to react.

---

### 4. Cross-Panel Reactivity

The most important part of this project is how the panels react to each other through shared state.

There are three main interactions:

- Clicking a planet in the Browser updates the Detail View.
- Changing a condition in the Controller updates the Browser list.
- Changing a condition in the Controller also updates the feasibility of the selected planet in the Detail View.

The key moment I am designing for is when the user changes one value in the Controller and sees both the Browser and Detail View update at the same time. This shows that all components are connected through a single state.

---

### 5. Feasibility Logic

The system evaluates each planet based on a set of conditions such as distance, temperature, planet type, and habitability score.

Instead of storing these results, they are calculated whenever the constraints change. This keeps the logic consistent and avoids unnecessary duplication of data.

The result is shown as:
- a score
- a status (GO, CAUTION, NO-GO)
- and a breakdown of checks

---

### 6. Visual Direction

The interface is designed to feel like a mission control system.

I chose a dark color palette with high contrast text to make data easy to read. The goal is not to make it look playful, but to make it feel like a tool used for making decisions.

- Background: deep navy
- Panels: slightly lighter surfaces
- Accent: cyan for active states
- Status colors: green (GO), amber (CAUTION), red (NO-GO)

Typography is kept simple using a clean sans-serif for UI and a monospace font for numbers to improve readability.

---

### 7. Intended Experience

I want the system to feel clear and responsive.

When the user interacts with one part of the interface, the rest of the system should respond immediately. The goal is for the user to understand that they are not just browsing data, but actively shaping the outcome through their decisions.

The most important experience is seeing how a small change in constraints can completely change the evaluation of a planet without changing the selection itself.

---

## System Diagram

How state flows between the App and its three panels.

![System Diagram]()

State lives only in App. Browser and Detail are read-only — they receive props and render. Controller is the only panel that writes back to App.

---

## AI Direction Log

*(Populated as the project develops — entries committed alongside the code changes they describe.)*

### Entry 1 — [pending]
**Asked:**
**AI produced:**
**I changed:**
**Why:**

---

## Records of Resistance

*(3 documented moments of rejecting/revising AI output.)*

### Resistance 1 — [pending]
**AI gave me:**
**I rejected because:**
**What I did instead:**

---

## Five Questions Reflection

*(Completed before final submission.)*

1. **Can I defend this?** *(pending)*
2. **Is this mine?** *(pending)*
3. **Did I verify?** *(pending)*
4. **Would I teach this?** *(pending)*
5. **Is my documentation honest?** *(pending)*

