import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { preloadVideo } from "../utils/videoPreload";

function formatTime(value) {
  if (!Number.isFinite(value)) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ImmersivePlayer({ project, onClose, onPrev, onNext }) {
  const videoRef = useRef(null);
  const controlsTimerRef = useRef(0);
  const playAttemptRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPoster, setShowPoster] = useState(true);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !project?.video) return undefined;

    preloadVideo(project.video, { priority: "auto" });

    const attemptId = ++playAttemptRef.current;

    setIsMuted(false);
    setIsPlaying(false);
    setShowDetails(false);
    setShowPoster(true);

    video.muted = false;
    video.volume = 1;
    video.currentTime = 0;

    const startPlayback = async () => {
      try {
        if (attemptId !== playAttemptRef.current) return;

        await video.play();

        if (attemptId !== playAttemptRef.current) return;

        setIsPlaying(true);
        setIsMuted(false);
      } catch (error) {
        if (error?.name === "AbortError") {
          console.warn("Playback attempt aborted safely:", error.message);
          return;
        }

        console.warn("Fullscreen video play failed:", error);
      }
    };

    if (video.readyState >= 2) {
      void startPlayback();
      return () => {
        playAttemptRef.current += 1;
      };
    }

    const onCanPlay = () => {
      void startPlayback();
    };

    video.addEventListener("canplay", onCanPlay, { once: true });

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      playAttemptRef.current += 1;
    };
  }, [project]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, []);

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

  const requestClose = useCallback(() => {
    setIsClosing(true);
    window.clearTimeout(controlsTimerRef.current);
    window.setTimeout(() => onClose(), 1120);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") requestClose();
      if (event.key === "ArrowRight") onNext();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, requestClose, togglePlay]);

  useEffect(() => {
    revealControls();
    return () => {
      window.clearTimeout(controlsTimerRef.current);
    };
  }, [revealControls]);

  const timeLabel = useMemo(
    () => `${formatTime(currentTime)} / ${formatTime(duration)}`,
    [currentTime, duration]
  );

  return (
    <div className={`immersive-player ${isClosing ? "is-closing" : ""}`}>
      <div className="immersive-player-backdrop" />

      <div
        className="immersive-player-shell"
        onMouseMove={revealControls}
        onTouchStart={revealControls}
      >
        <button
          type="button"
          className={`immersive-player-close-x ${showControls ? "is-visible" : ""}`}
          onClick={requestClose}
          aria-label="Close video"
        >
          X
        </button>

        <video
          ref={videoRef}
          className={`immersive-player-video ${showPoster ? "is-buffering" : ""}`}
          src={project.video}
          poster={project.cover}
          playsInline
          preload="auto"
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onPlay={() => {
            setIsPlaying(true);
            setShowPoster(false);
          }}
          onPlaying={() => setShowPoster(false)}
          onPause={() => setIsPlaying(false)}
        />

        <div className={`immersive-player-headline ${showControls ? "is-visible" : ""}`}>
          <span>{project.title}</span>
          <span>{project.category}</span>
          <span>{project.year}</span>
        </div>

        <div className={`immersive-player-controls ${showControls ? "is-visible" : ""}`}>
          <span>Nico Svetliza™</span>
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
          <button type="button" onClick={() => setShowDetails((open) => !open)}>
            {showDetails ? "Hide details" : "Details"}
          </button>
          <button type="button" onClick={onPrev}>
            Prev
          </button>
          <button type="button" onClick={onNext}>
            Next
          </button>
          <button type="button" onClick={requestClose}>
            Close
          </button>
          <Link to="/work">Portfolio</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </div>

        {showDetails ? (
          <aside className={`immersive-player-details ${showControls ? "is-visible" : ""}`}>
            <p>{project.title}</p>
            <p>
              {project.category} / {project.year}
            </p>
            {project.description ? <p>{project.description}</p> : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
