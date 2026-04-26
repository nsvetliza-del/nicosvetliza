import React, { useEffect, useState } from "react";

// Optional VFX support:
// import transitionVfxSrc from "../assets/vfx/transition-vfx.webm";
// const transitionVfxSrc = null;

export default function VideoTransitionLayer({ project, originRect, onComplete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const startTimer = window.setTimeout(() => setIsExpanded(true), 24);
    const finishTimer = window.setTimeout(() => onComplete?.(), 1280);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onComplete]);

  if (!project || !originRect) return null;

  const collapsedStyle = {
    top: `${originRect.top}px`,
    left: `${originRect.left}px`,
    width: `${originRect.width}px`,
    height: `${originRect.height}px`,
  };

  return (
    <div className={`video-transition-layer ${isExpanded ? "is-expanded" : ""}`}>
      <div className="video-transition-backdrop" />
      {/* Enable the optional import above and render this video for a transition overlay. */}
      {/* {transitionVfxSrc ? (
        <video
          className="video-transition-vfx"
          src={transitionVfxSrc}
          autoPlay
          muted
          playsInline
        />
      ) : null} */}
      <div className="video-transition-media" style={collapsedStyle}>
        <video
          className="video-transition-video"
          src={project.video}
          poster={project.cover}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>
    </div>
  );
}
