import React from "react";

export default function RandomPlayButton({
  onClick,
  isDizzy = false,
  isDraggingFast = false,
}) {
  return (
    <button
      type="button"
      className={`random-play-button ${isDraggingFast ? "is-hidden-fast" : ""}`}
      onClick={onClick}
      aria-label="Play random project"
      title="Play random project"
    >
      {isDizzy ? "I feel dizzy." : "click to open randomly"}
    </button>
  );
}
