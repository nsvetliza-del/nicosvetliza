import React from 'react'
import { Link } from "react-router-dom";

export default function ProjectCard({ project, index = 0, variant = "standard" }) {
  const coverImage = project.images?.[0];
  const projectNumber = String(index + 1).padStart(2, "0");
  const mediaMode = project.video ? "video" : "image";

  return (
    <Link to={`/work/${project.slug}`} className={`project-card is-${variant} is-${mediaMode}`}>
      <div className="project-card-frame">
        <div
          className="project-card-media"
          style={{
            backgroundImage:
              mediaMode === "image" && coverImage
                ? `linear-gradient(180deg, rgba(248, 247, 243, 0.02), rgba(17, 17, 17, 0.06)), url(${coverImage})`
                : undefined,
          }}
        >
          {mediaMode === "video" && project.video ? (
            <iframe
              src={project.video}
              title={`${project.title} preview`}
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : null}

          {mediaMode === "image" && !coverImage ? (
            <div className="media-placeholder">Replace project cover image</div>
          ) : null}

        </div>
      </div>
    </Link>
  );
}
