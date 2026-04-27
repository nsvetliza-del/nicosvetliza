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
    </article>
  );
}
