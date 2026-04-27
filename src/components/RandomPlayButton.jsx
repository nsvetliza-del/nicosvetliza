import React from "react";

export default function RandomPlayButton({
  onClick,
  isDizzy = false,
}) {
  return (
    <button
      type="button"
      className="random-play-button"
      onClick={onClick}
      aria-label="Play random project"
      title="Play random project"
    >
      {isDizzy ? "I feel dizzy." : "click to open randomly"}
    </button>
  );
}
