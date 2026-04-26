import React from 'react'
export default function FilterBar({ options, activeFilter, onChange }) {
  return (
    <div className="filter-bar" role="tablist" aria-label="Project filters">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`filter-chip ${activeFilter === option ? "is-active" : ""}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
