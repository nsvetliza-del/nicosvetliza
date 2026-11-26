import React, { useEffect } from "react";
import { preloadVideo } from "../utils/videoPreload";

export default function TitlesIndex({ isOpen, projects, onClose, onProjectSelect }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="titles-index" role="dialog" aria-modal="true" aria-label="Index">
      <button type="button" className="titles-index-close" onClick={onClose}>
        close
      </button>

      <ol className="titles-index-list">
        {projects.map((project, index) => (
          <li key={project.id}>
            <button
              type="button"
              className="titles-index-item"
              onMouseEnter={() => preloadVideo(project.previewVideo || project.video)}
              onClick={(event) => {
                preloadVideo(project.fullVideo || project.previewVideo || project.video, {
                  priority: "auto",
                });
                const rect = event.currentTarget.getBoundingClientRect();
                onClose();
                onProjectSelect(project.id, rect);
              }}
            >
              <span className="titles-index-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="titles-index-title">{project.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
