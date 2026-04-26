import React from 'react'
export default function VideoCard({ project }) {
  return (
    <article className="video-card">
      <div className="video-frame">
        {/* Replace the video URL inside src/data/projects.js if you want to show another embed */}
        {project.video ? (
          <iframe
            src={project.video}
            title={`${project.title} video`}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="media-placeholder">Replace this with a Vimeo or YouTube embed URL</div>
        )}
      </div>
      <div className="video-card-copy">
        <div className="video-card-meta">
          <span>{project.brand}</span>
          <span>{project.group}</span>
          <span>{project.year}</span>
        </div>
        <h3>{project.title}</h3>
        <p>{project.shortDescription}</p>
      </div>
    </article>
  );
}
