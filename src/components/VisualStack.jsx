import React from "react";

const positionClasses = [
  "is-left-outer",
  "is-left-mid",
  "is-center-left",
  "is-center",
  "is-center-right",
  "is-right-mid",
  "is-right-outer",
];

export default function VisualStack({ projects, onProjectSelect }) {
  return (
    <section className="visual-stack">
      <div className="visual-stack-inner">
        {projects.map((project, index) => (
          <button
            key={project.id}
            type="button"
            className={`visual-stack-card ${positionClasses[index % positionClasses.length]}`}
            onClick={() => onProjectSelect(project.id)}
          >
            <span
              className="visual-stack-image"
              style={{ backgroundImage: `url(${project.cover})` }}
            />
            <span className="visual-stack-meta">
              <span>{project.title}</span>
              <span>{project.category}</span>
              <span>{project.year}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
