import React, { useEffect } from "react";

export default function BluePulseOverlay({ pulse, onComplete }) {
  useEffect(() => {
    if (!pulse) return undefined;

    const timer = window.setTimeout(() => {
      onComplete?.();
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [pulse, onComplete]);

  if (!pulse) return null;

  return (
    <div className="background-wash">
      <div
        className="background-wash-pulse"
        style={{
          "--pulse-x": `${pulse.x}px`,
          "--pulse-y": `${pulse.y}px`,
        }}
      />
    </div>
  );
}
