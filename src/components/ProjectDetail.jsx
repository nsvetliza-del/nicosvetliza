import React from 'react'
import { Link } from "react-router-dom";
import CTA from "./CTA";
import WorkGrid from "./WorkGrid";

export default function ProjectDetail({ project, projectIndex = 0, relatedProjects = [] }) {
  const projectNumber = String(projectIndex + 1).padStart(2, "0");
  const fullSrc = project.fullVideo || project.previewVideo || project.video;

  return (
    <div className="project-detail">
      <section className="detail-hero section">
        <div className="container page-shell detail-shell">
          <div className="detail-copy">
            <div className="detail-header-meta">
              <p className="detail-number">{projectNumber}</p>
              <p className="eyebrow">{project.group}</p>
              <p className="detail-inline-meta">{project.brand}</p>
              <p className="detail-inline-meta">{project.year}</p>
            </div>
            <h1>{project.title}</h1>
          </div>

          <div className="detail-video">
            {fullSrc ? (
              <video
                src={fullSrc}
                title={`${project.title} showcase`}
                controls
                autoPlay
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="media-placeholder">Replace this area with a video embed URL</div>
            )}
          </div>

          <div className="detail-copy detail-copy-secondary">
            <p className="detail-summary">{project.description}</p>

            <dl className="detail-facts">
              <div>
                <dt>Role</dt>
                <dd>{project.role}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{project.group}</dd>
              </div>
            </dl>

            <Link className="detail-back-link" to="/work">
              Back to archive
            </Link>
          </div>
        </div>
      </section>

      <section className="section detail-gallery-section">
        <div className="container">
          <div className="image-gallery">
            {project.images.map((image, index) => (
              <div
                key={`${project.slug}-${index}`}
                className={`gallery-image ${index === 0 ? "is-large" : ""}`}
                style={{
                  backgroundImage: image
                    ? `linear-gradient(180deg, rgba(248, 247, 243, 0.02), rgba(17, 17, 17, 0.05)), url(${image})`
                    : undefined,
                }}
              >
                {!image && <div className="media-placeholder">Replace this with your project image</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {relatedProjects.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <p className="section-label">Related pieces</p>
              <h2>More from the archive.</h2>
            </div>
            <WorkGrid projects={relatedProjects} />
          </div>
        </section>
      ) : null}

      <CTA
        title="Need a curated visual system?"
        text="Campaigns, motion and brand assets built with structure, clarity and visual control."
      />
    </div>
  );
}
