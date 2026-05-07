import React, { useEffect, useMemo, useRef } from "react";
import { categories } from "../data/projects";

export default function VideoCarousel({
  activeCategory,
  onCategoryChange,
  projects,
  selectedProjectId,
  onSelectProject,
}) {
  const activeIndex = useMemo(
    () => Math.max(0, projects.findIndex((project) => project.id === selectedProjectId)),
    [projects, selectedProjectId]
  );

  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const activeCard = track.querySelector(`[data-project-index="${activeIndex}"]`);
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <section className="portfolio-stage">
      <div className="portfolio-headline">
        <p className="portfolio-kicker">Portfolio</p>
        <div className="portfolio-filter">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`portfolio-filter-chip ${activeCategory === category ? "is-active" : ""}`}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="carousel-shell">
        <div className="carousel-track" ref={trackRef}>
          {projects.map((project, index) => (
            (() => {
              const videoSrc = project.previewVideo || project.video;

              return (
                <button
                  key={project.id}
                  type="button"
                  className={`carousel-card ${project.id === selectedProjectId ? "is-active" : ""}`}
                  data-project-index={index}
                  onClick={() => onSelectProject(project.id)}
                >
                  {videoSrc ? (
                    <video
                      className="carousel-card-cover"
                      src={videoSrc}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <span
                      className="carousel-card-cover"
                      style={{ backgroundImage: `url(${project.cover})` }}
                    />
                  )}
                </button>
              );
            })()
          ))}
        </div>
      </div>
    </section>
  );
}
