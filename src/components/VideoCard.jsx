import React from 'react'
export default function VideoCard({ project }) {
  const videoSrc = project.previewVideo || project.video;

  return (
    <article className="video-card">
      <div className="video-frame">
        {videoSrc ? (
          <video
            src={videoSrc}
            title={`${project.title} video`}
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="media-placeholder">Replace this with a Vimeo or YouTube embed URL</div>
        )}
      </div>
    </article>
  );
}
