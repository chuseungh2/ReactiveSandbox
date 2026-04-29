// src/components/Intro.jsx
// Cinematic cold-open with two scenes:
//   1. terminal — character-by-character typewriter mission briefing
//   2. title    — PROJECT EXODUS title card + BEGIN MISSION button
//
// Manages its own scene state and typewriter progression. Calls
// onComplete() when the user clicks BEGIN MISSION (or SKIP).
//
// Each terminal line has its own char-typing speed and pause-after.
// A single useEffect drives the timer:
//   • if more chars remain in the current line, type one more
//   • else if the line is finished, pause, then advance to the next
//   • else (all lines typed), hold briefly, then move to title

import { useEffect, useRef, useState } from "react";

const TERMINAL_LINES = [
  { text: "EXODUS MISSION CONSOLE",                            style: "header",   charDelay: 30, pauseAfter: 350 },
  { text: "Earth · year 2387 · status critical",               style: "log",      charDelay: 18, pauseAfter: 700 },
  { text: "",                                                  style: "blank",    pauseAfter: 220 },
  { text: "Connecting to Deep Space Network...",               style: "log",      charDelay: 14, pauseAfter: 320 },
  { text: "39 habitable exoplanet candidates within 1500 ly",  style: "log",      charDelay: 14, pauseAfter: 750 },
  { text: "",                                                  style: "blank",    pauseAfter: 220 },
  { text: "Your task: find a world that can sustain",          style: "mission",  charDelay: 18, pauseAfter: 220 },
  { text: "a mission off Earth.",                              style: "mission",  charDelay: 18, pauseAfter: 700 },
  { text: "",                                                  style: "blank",    pauseAfter: 200 },
  { text: "Configure the mission profile.",                    style: "mission",  charDelay: 18, pauseAfter: 280 },
  { text: "The same world becomes GO, CAUTION, or NO-GO",      style: "highlight",charDelay: 22, pauseAfter: 220 },
  { text: "depending on what you ask.",                        style: "highlight",charDelay: 22, pauseAfter: 900 },
];

const EXIT_MS = 600; // fade-out animation length

export default function Intro({ onComplete }) {
  const [scene, setScene] = useState("terminal"); // "terminal" | "title"
  const [step, setStep] = useState(0);            // index into TERMINAL_LINES
  const [chars, setChars] = useState(0);          // chars typed of current line
  const [exiting, setExiting] = useState(false);

  // Cancel any pending advancement once we start exiting.
  const exitingRef = useRef(false);
  exitingRef.current = exiting;

  useEffect(() => {
    if (scene !== "terminal") return;

    // All lines typed — wait for the user to click CONTINUE. No auto-advance.
    if (step >= TERMINAL_LINES.length) return;

    const line = TERMINAL_LINES[step];
    const text = line.text;

    if (line.style === "blank") {
      // Blank lines just pause without typing
      const t = setTimeout(() => {
        setStep((s) => s + 1);
        setChars(0);
      }, line.pauseAfter);
      return () => clearTimeout(t);
    }

    if (chars < text.length) {
      // Still typing this line
      const t = setTimeout(() => setChars((c) => c + 1), line.charDelay);
      return () => clearTimeout(t);
    }

    // Line complete — pause, then move on
    const t = setTimeout(() => {
      setStep((s) => s + 1);
      setChars(0);
    }, line.pauseAfter);
    return () => clearTimeout(t);
  }, [scene, step, chars]);

  function finish() {
    if (exiting) return;
    setExiting(true);
    setTimeout(onComplete, EXIT_MS);
  }

  // Skip from terminal → straight to title (don't bail out of intro entirely
  // unless the user clicks SKIP a second time on the title card).
  function skipTerminal() {
    if (scene === "terminal") {
      setScene("title");
    } else {
      finish();
    }
  }

  // Render the terminal lines: completed ones in full, current one
  // partially with a blinking cursor.
  function renderTerminal() {
    const allDone = step >= TERMINAL_LINES.length;
    const completedLines = TERMINAL_LINES.slice(0, step);
    const currentLine = !allDone ? TERMINAL_LINES[step] : null;

    return (
      <div className="intro__terminal" role="log" aria-label="Mission briefing">
        {completedLines.map((line, i) =>
          line.style === "blank" ? (
            <div key={i} className="intro__terminal-blank" />
          ) : (
            <TerminalLine key={i} text={line.text} style={line.style} cursor={false} />
          )
        )}
        {currentLine && currentLine.style !== "blank" && (
          <TerminalLine
            text={currentLine.text.slice(0, chars)}
            style={currentLine.style}
            cursor={true}
          />
        )}
        {allDone && (
          <>
            <TerminalLine text="" style="log" cursor={true} idleCursor={true} />
            <div className="intro__continue">
              <button
                className="intro__continue-btn"
                onClick={() => setScene("title")}
                autoFocus
              >
                <span className="intro__begin-bracket">[</span>
                <span className="intro__begin-text">CONTINUE</span>
                <span className="intro__begin-bracket">]</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={"intro" + (exiting ? " intro--exiting" : "")}>
      <div className="intro__skip">
        <button
          onClick={scene === "terminal" ? skipTerminal : finish}
          aria-label={scene === "terminal" ? "Skip briefing" : "Skip intro"}
        >
          SKIP &rsaquo;
        </button>
      </div>

      <div className="intro__stage">
        {scene === "terminal" && renderTerminal()}

        {scene === "title" && (
          <div className="intro__titlecard" key="title">
            <div className="intro__sigil" aria-hidden>◈</div>
            <h1 className="intro__title">PROJECT EXODUS</h1>
            <p className="intro__subtitle">Mission Planning Console</p>
            <button className="intro__begin" onClick={finish}>
              <span className="intro__begin-bracket">[</span>
              <span className="intro__begin-text">BEGIN MISSION</span>
              <span className="intro__begin-bracket">]</span>
            </button>
            <p className="intro__op">Operator clearance &middot; EXODUS-7</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── A single terminal line: prompt + text + optional blinking cursor ───
function TerminalLine({ text, style, cursor, idleCursor }) {
  const prompt =
    style === "mission" || style === "highlight" ? ">> " :
    style === "header"  ? "▶ " :
    "> ";
  return (
    <div className={"intro__terminal-line intro__terminal-line--" + style}>
      <span className="intro__terminal-prompt">{prompt}</span>
      <span className="intro__terminal-text">{text}</span>
      {cursor && (
        <span className={"intro__terminal-cursor" + (idleCursor ? " intro__terminal-cursor--idle" : "")}>
          ▌
        </span>
      )}
    </div>
  );
}
