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
  const touchStartXRef = useRef(0);
  const touchDeltaXRef = useRef(0);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [showRandomButton, setShowRandomButton] = useState(false);
  const [isCarouselMoving, setIsCarouselMoving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

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
    if (!element || isMobile) return undefined;

    const handleWheel = (event) => {
      event.preventDefault();
      hideRandomButton();
      targetRotationRef.current += event.deltaY * 0.0011;
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [isMobile]);

  useEffect(() => {
    projects.slice(0, 8).forEach((project) => preloadVideo(project.video));
  }, [projects]);

  useEffect(() => {
    if (!sonicShuffleTick || projects.length === 0) return undefined;

    hideRandomButton();
    window.clearTimeout(shuffleTimerRef.current);

    const randomIndex = Math.floor(Math.random() * projects.length);

    if (isMobile) {
      setActiveIndex(randomIndex);
      return undefined;
    }

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
  }, [isMobile, sonicShuffleTick, projects]);

  useEffect(() => {
    if (!projects.length) return;
    setActiveIndex((current) => Math.min(current, projects.length - 1));
  }, [projects]);

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

  const getWrappedOffset = (index) => {
    const total = projects.length;
    if (!total) return 0;

    let offset = index - activeIndex;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
    return offset;
  };

  const visibleMobileItems = useMemo(() => {
    if (!isMobile) return [];

    return projects
      .map((project, index) => {
        const offset = getWrappedOffset(index);
        if (Math.abs(offset) > 2) return null;

        const distance = Math.abs(offset);
        const translateX = offset * 62;
        const scale = distance === 0 ? 1 : distance === 1 ? 0.78 : 0.62;
        const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.16;
        const zIndex = 20 - distance;

        return {
          project,
          index,
          isActive: offset === 0,
          isPrepared: distance <= 1 || hoveredProjectId === project.id,
          style: {
            transform: `translate3d(calc(-50% + ${translateX}vw), -50%, 0) scale(${scale})`,
            opacity,
            zIndex,
          },
        };
      })
      .filter(Boolean);
  }, [activeIndex, hoveredProjectId, isMobile, projects]);

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? 0;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (event) => {
    touchDeltaXRef.current = (event.touches[0]?.clientX ?? 0) - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaXRef.current;
    if (Math.abs(delta) < 40 || projects.length <= 1) return;

    setActiveIndex((current) => {
      const next = delta < 0 ? current + 1 : current - 1;
      return (next + projects.length) % projects.length;
    });
  };

  const activeMobileProject = isMobile && projects.length > 0 ? projects[activeIndex] : null;

  return (
    <section className="video-wheel-section">
      {isMobile ? (
        <div
          className="video-wheel-frame video-wheel-frame-mobile"
          ref={wheelRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="video-wheel video-wheel-mobile">
            {visibleMobileItems.map(({ project, style, isActive, isPrepared }) => (
              <button
                key={project.id}
                type="button"
                className={`video-wheel-item video-wheel-item-mobile ${
                  isActive ? "is-focused" : ""
                } ${launchingProjectId === project.id ? "is-launching" : ""}`}
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
                  preloadVideo(project.video);
                  const rect =
                    mediaElement?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
                  onProjectSelect(project.id, rect);
                }}
              >
                <div className="video-wheel-media">
                  {project.video || project.cover ? (
                    <video
                      className="video-wheel-video"
                      src={project.video}
                      poster={project.cover}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload={isPrepared ? "auto" : "metadata"}
                    />
                  ) : (
                    <div className="video-wheel-fallback">{project.title}</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {activeMobileProject ? (
            <div className="video-wheel-mobile-title">
              <span>{activeMobileProject.title}</span>
            </div>
          ) : null}
        </div>
      ) : (
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
                className={`video-wheel-item ${isFocused ? "is-focused" : ""} ${
                  launchingProjectId === project.id ? "is-launching" : ""
                }`}
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
                    mediaElement?.getBoundingClientRect() ??
                    event.currentTarget.getBoundingClientRect();
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
      )}
    </section>
  );
}
