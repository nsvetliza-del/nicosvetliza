import React, { useEffect, useState } from "react";

// Change name and intro subtitle here.
const NAME = "Nico Svetliza";
const SUBTITLE = "Audiovisual / Advertising / Sound";

export default function Intro({ enabled = true, onComplete }) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const leaveTimer = window.setTimeout(() => setIsLeaving(true), 1900);
    const finishTimer = window.setTimeout(() => onComplete?.(), 2800);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(finishTimer);
    };
  }, [enabled, onComplete]);

  if (!enabled) return null;

  return (
    <div className={`intro-screen ${isLeaving ? "is-leaving" : ""}`} aria-hidden="true">
      <div className="intro-copy">
        <h1>{NAME}</h1>
        <p>{SUBTITLE}</p>
      </div>
    </div>
  );
}
