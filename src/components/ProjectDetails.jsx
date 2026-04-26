import React from "react";

export default function ProjectDetails({ project, onClose }) {
  return (
    <aside className="project-details-panel">
      <button type="button" className="project-details-close" onClick={onClose}>
        Close details
      </button>

      <div className="project-details-copy">
        <p>{project.title}</p>
        <p>{project.category}</p>
        <p>{project.year}</p>
        {project.description ? <p>{project.description}</p> : null}
      </div>
    </aside>
  );
}
