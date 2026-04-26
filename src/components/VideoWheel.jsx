import React, { useEffect, useMemo, useRef, useState } from "react";
import RandomPlayButton from "./RandomPlayButton";
import { preloadVideo } from "../utils/videoPreload";

export default function VideoWheel({
  projects,
  onProjectSelect,
  launchingProjectId = null,
  isReady = true,
  sonicShuffleTick = 0,
}) {
  const wheelRef = useRef(null);
  const frameRef = useRef(0);
  const randomTimerRef = useRef(0);
  const shuffleTimerRef = useRef(0);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [showRandomButton, setShowRandomButton] = useState(false);
  const [isCarouselMoving, setIsCarouselMoving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hideRandomButton = () => {
    setIsCarouselMoving(true);
    setShowRandomButton(false);
    window.clearTimeout(randomTimerRef.current);
    randomTimerRef.current = window.setTimeout(() => {
      setIsCarouselMoving(false);
      setShowRandomButton(true);
    }, 700);
  };

  useEffect(() => {
    const animate = () => {
      rotationRef.current += (targetRotationRef.current - rotationRef.current) * 0.11;
      setRotation(rotationRef.current);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    hideRandomButton();

    return () => {
      window.clearTimeout(randomTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      setIsExpanded(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsExpanded(true);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [isReady]);

  useEffect(() => () => window.clearTimeout(shuffleTimerRef.current), []);

  useEffect(() => {
    const element = wheelRef.current;
    if (!element) return undefined;

    const handleWheel = (event) => {
      event.preventDefault();
      hideRandomButton();
      targetRotationRef.current += event.deltaY * 0.0011;
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    projects.slice(0, 8).forEach((project) => preloadVideo(project.video));
  }, [projects]);

  useEffect(() => {
    if (!sonicShuffleTick || projects.length === 0) return undefined;

    hideRandomButton();
    window.clearTimeout(shuffleTimerRef.current);

    const randomIndex = Math.floor(Math.random() * projects.length);
    const total = projects.length;
    const baseAngle = (randomIndex / total) * Math.PI * 2;
    const currentRotation = rotationRef.current;
    const frontAngle = Math.PI / 2;

    let finalRotation = frontAngle - baseAngle;
    const diff = finalRotation - currentRotation;
    finalRotation =
      currentRotation +
      Math.atan2(Math.sin(diff), Math.cos(diff));

    const spinDirection = Math.random() > 0.5 ? 1 : -1;
    targetRotationRef.current = finalRotation + spinDirection * 0.42;

    shuffleTimerRef.current = window.setTimeout(() => {
      targetRotationRef.current = finalRotation;
    }, 240);

    return () => window.clearTimeout(shuffleTimerRef.current);
  }, [sonicShuffleTick, projects]);

  const items = useMemo(() => {
    const total = projects.length || 1;
    const radiusX = Math.max(580, Math.min(700, total * 34));
    const radiusY = Math.max(165, Math.min(210, total * 9));

    return projects.map((project, index) => {
      const baseAngle = (index / total) * Math.PI * 2;
      const angle = baseAngle + rotation;
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      const depth = (Math.sin(angle) + 1) / 2;
      const scale = 0.72 + depth * 0.28;
      const opacity = 0.55 + depth * 0.45;
      const zIndex = Math.round(depth * 100);
      const isFocused = Math.abs(x) < 110 && depth > 0.82;
      const isPrepared = depth > 0.58 || isFocused;

      return {
        index,
        x,
        project,
        style: {
          "--depth": depth,
          "--intro-delay": isExpanded ? "0ms" : `${index * 40}ms`,
          transform: isExpanded
            ? `translate3d(calc(-50% + ${x}px), ${y}px, 0) scale(${scale})`
            : "translate3d(-50%, 0, 0) scale(0.65)",
          opacity: isExpanded ? opacity : 0.94,
          zIndex,
        },
        isFocused,
        isPrepared,
      };
    });
  }, [projects, rotation, isExpanded]);

  useEffect(() => {
    if (!items.length || !projects.length) return;

    const focusedItem = items.reduce((closest, item) =>
      item.style.zIndex > closest.style.zIndex ? item : closest
    );

    const current = projects[focusedItem.index];
    const prev = projects[(focusedItem.index - 1 + projects.length) % projects.length];
    const next = projects[(focusedItem.index + 1) % projects.length];

    [current, prev, next].forEach((project) => preloadVideo(project?.video));
  }, [items, projects]);

  return (
    <section className="video-wheel-section">
      <div className="video-wheel-frame" ref={wheelRef}>
        <div className="video-wheel">
          {projects.length > 0 ? (
            <RandomPlayButton
              onClick={(event) => {
                const randomProject = projects[Math.floor(Math.random() * projects.length)];
                if (!randomProject) return;
                preloadVideo(randomProject.video);
                const rect = event.currentTarget.getBoundingClientRect();
                onProjectSelect(randomProject.id, rect);
              }}
              isVisible={showRandomButton && !isCarouselMoving}
            />
          ) : null}
          {items.map(({ project, style, isFocused, isPrepared }) => (
            <button
              key={project.id}
              type="button"
              className={`video-wheel-item ${isFocused ? "is-focused" : ""} ${launchingProjectId === project.id ? "is-launching" : ""}`}
              style={style}
              onMouseEnter={() => {
                setHoveredProjectId(project.id);
                preloadVideo(project.video);
              }}
              onFocus={() => {
                setHoveredProjectId(project.id);
                preloadVideo(project.video);
              }}
              onMouseLeave={() => setHoveredProjectId(null)}
              onBlur={() => setHoveredProjectId(null)}
              onClick={(event) => {
                const mediaElement = event.currentTarget.querySelector(".video-wheel-media");
                const videoElement = mediaElement?.querySelector("video");
                preloadVideo(project.video);
                if (videoElement) {
                  videoElement.preload = "auto";
                  videoElement.load();
                  void videoElement.play().catch(() => {});
                }
                const rect =
                  mediaElement?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
                onProjectSelect(project.id, rect);
              }}
            >
              <div className="video-wheel-media">
                <video
                  className="video-wheel-video"
                  src={project.video}
                  poster={project.cover}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload={isPrepared || hoveredProjectId === project.id ? "auto" : "metadata"}
                />
              </div>

              <div className="video-wheel-meta">
                <span>{project.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
