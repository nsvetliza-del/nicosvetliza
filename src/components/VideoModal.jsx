import React, { useEffect, useRef } from "react";

export default function VideoModal({ project, onClose, onPrev, onNext }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    void video.play().catch(() => {});
  }, [project]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  if (!project) return null;

  const fullSrc = project.fullVideo || project.previewVideo || project.video;

  return (
    <div className="video-modal" role="dialog" aria-modal="true" aria-label={project.title}>
      <button type="button" className="video-modal-backdrop" aria-label="Close video" onClick={onClose} />

      <div className="video-modal-panel">
        <div className="video-modal-topbar">
          <div className="video-modal-meta">
            <span>{project.title}</span>
            <span>{project.category}</span>
            <span>{project.year}</span>
          </div>
          <button type="button" className="video-modal-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="video-modal-player-shell">
          <button type="button" className="video-modal-arrow is-left" onClick={onPrev} aria-label="Previous project">
            Prev
          </button>
          <div className="video-modal-player">
            <video ref={videoRef} src={fullSrc} controls autoPlay playsInline preload="metadata" />
          </div>
          <button type="button" className="video-modal-arrow is-right" onClick={onNext} aria-label="Next project">
            Next
          </button>
        </div>

        {project.description ? <p className="video-modal-description">{project.description}</p> : null}
      </div>
    </div>
  );
}
