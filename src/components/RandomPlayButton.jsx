import React from "react";

export default function RandomPlayButton({ onClick, isVisible = false }) {
  return (
    <button
      type="button"
      className={`video-wheel-random ${isVisible ? "is-visible" : ""}`}
      onClick={onClick}
      aria-label="Play random project"
      title="Random"
    >
      <svg
        className="video-wheel-random-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16.5 6H21v4.5" />
        <path d="M3 18l6.5-6.5a2.7 2.7 0 0 1 1.9-.8h1.8" />
        <path d="M21 6l-5.8 5.8" />
        <path d="M16.5 18H21v-4.5" />
        <path d="M3 6l6.5 6.5a2.7 2.7 0 0 0 1.9.8h1.8" />
        <path d="M21 18l-5.8-5.8" />
      </svg>
    </button>
  );
}
