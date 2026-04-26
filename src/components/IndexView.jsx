import React, { useEffect, useMemo, useRef, useState } from "react";
import { preloadVideo } from "../utils/videoPreload";

const SERVICE_LABELS = {
  commercial: "Commercial",
  "short-film": "Short Film",
  "music-video": "Music Video",
};

function getClientName(project) {
  if (project.client) return project.client;
  if (project.type === "commercial") return project.title;
  return "Independent";
}

function getServiceLabel(project) {
  return SERVICE_LABELS[project.type] ?? project.category ?? "";
}

export default function IndexView({
  projects,
  onProjectSelect,
  isActive,
  onHoverVideoChange,
}) {
  const [hoveredProject, setHoveredProject] = useState(null);
  const [displayProject, setDisplayProject] = useState(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const clearTimerRef = useRef(0);

  useEffect(() => {
    return () => {
      window.clearTimeout(clearTimerRef.current);
    };
  }, []);

  useEffect(() => {
    onHoverVideoChange?.(isVideoVisible);
    return () => onHoverVideoChange?.(false);
  }, [isVideoVisible, onHoverVideoChange]);

  useEffect(() => {
    if (hoveredProject) {
      preloadVideo(hoveredProject.video);
      setDisplayProject(hoveredProject);
      setIsVideoVisible(true);
      return;
    }

    setIsVideoVisible(false);
    window.clearTimeout(clearTimerRef.current);
    clearTimerRef.current = window.setTimeout(() => {
      setDisplayProject(null);
      setIsVertical(false);
    }, 360);
  }, [hoveredProject]);

  const rows = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        clientName: getClientName(project),
        serviceLabel: getServiceLabel(project),
        yearLabel: project.year ?? "",
      })),
    [projects]
  );

  return (
    <section className={`index-view ${isActive ? "is-active" : ""} ${isVideoVisible ? "has-video" : ""}`}>
      <div className={`index-view-backdrop ${isVideoVisible ? "is-visible" : ""}`}>
        {displayProject ? (
          <div className={`index-view-backdrop-media ${isVertical ? "is-vertical" : ""}`}>
            {(isVertical ? [0, 1, 2] : [1]).map((instance) => (
              <video
                key={`${displayProject.id}-${instance}`}
                className="index-view-backdrop-video"
                src={displayProject.video}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onLoadedMetadata={(event) => {
                  const { videoWidth, videoHeight } = event.currentTarget;
                  setIsVertical(videoHeight > videoWidth);
                }}
              />
            ))}
          </div>
        ) : null}
        <div className="index-view-backdrop-overlay" />
      </div>

      <div className="index-view-table" role="table" aria-label="Project index">
        <div className="index-view-head" role="row">
          <span>Client</span>
          <span>Project</span>
          <span>Service</span>
          <span>Year</span>
        </div>

        <div className="index-view-body">
          {rows.map((project) => (
            <button
              key={project.id}
              type="button"
              className="index-view-row"
              role="row"
              onMouseEnter={() => setHoveredProject(project)}
              onFocus={() => setHoveredProject(project)}
              onMouseLeave={() => setHoveredProject(null)}
              onBlur={() => setHoveredProject(null)}
              onClick={(event) => {
                preloadVideo(project.video);
                const rect = event.currentTarget.getBoundingClientRect();
                onProjectSelect(project.id, rect);
              }}
            >
              <span>{project.clientName}</span>
              <span className="index-view-project">{project.title}</span>
              <span>{project.serviceLabel}</span>
              <span>{project.yearLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
