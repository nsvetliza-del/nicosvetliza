import React from "react";

export default function RandomPlayButton({
  onClick,
  isVisible = false,
  isDizzy = false,
}) {
  return (
    <button
      type="button"
      className={`video-wheel-random random-play-button ${isVisible ? "is-visible" : ""}`}
      onClick={onClick}
      aria-label="Play random project"
      title="Play random project"
    >
      {isDizzy ? "I feel dizzy." : "click to open randomly"}
    </button>
  );
}
