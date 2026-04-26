import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

function formatTime(value) {
  if (!Number.isFinite(value)) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function VideoPlayerExperience({
  project,
  onClose,
  onNext,
  onPrev,
  onToggleDetails,
  showDetails,
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
    video.muted = true;
    setIsMuted(true);
    setIsPlaying(true);
    void video.play().catch(() => {});
  }, [project]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleSound = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await video.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNext();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev, togglePlay]);

  const timeLabel = useMemo(
    () => `${formatTime(currentTime)} / ${formatTime(duration)}`,
    [currentTime, duration]
  );

  return (
    <div className="player-experience">
      <div className="player-background" />

      <div className="player-surface">
        <video
          ref={videoRef}
          className="player-video"
          src={project.video}
          autoPlay
          muted
          playsInline
          preload="metadata"
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <div className="player-nav-line">
          <span>Nico Svetliza™</span>
          <span>{project.title}</span>
          <span>{timeLabel}</span>
          <button type="button" onClick={togglePlay}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={toggleSound}>
            {isMuted ? "Sound on" : "Sound off"}
          </button>
          <button type="button" onClick={toggleFullscreen}>
            Fullscreen
          </button>
          <button type="button" onClick={onToggleDetails}>
            {showDetails ? "Hide details" : "Details"}
          </button>
          <button type="button" onClick={onPrev}>
            Prev
          </button>
          <button type="button" onClick={onNext}>
            Next
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
          <Link to="/work">Works</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </div>
  );
}
