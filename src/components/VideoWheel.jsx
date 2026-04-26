import React, { useEffect, useMemo, useRef, useState } from "react";
import RandomPlayButton from "./RandomPlayButton";
import { preloadVideo, preloadVideoBatch } from "../utils/videoPreload";

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
  const mobileTouchLastXRef = useRef(0);
  const mobileTouchMovedRef = useRef(false);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [showRandomButton, setShowRandomButton] = useState(false);
  const [isCarouselMoving, setIsCarouselMoving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const hideRandomButton = () => {
    setIsCarouselMoving(true);
    setShowRandomButton(false);
    window.clearTimeout(randomTimerRef.current);
    randomTimerRef.current = window.setTimeout(() => {
      setIsCarouselMoving(false);
      setShowRandomButton(true);
    }, 700);
  };

  const rotateProjectToFront = (index, overshoot = 0) => {
    const total = projects.length;
    if (!total) return;

    const baseAngle = (index / total) * Math.PI * 2;
    const currentRotation = rotationRef.current;
    const frontAngle = Math.PI / 2;

    let finalRotation = frontAngle - baseAngle;
    const diff = finalRotation - currentRotation;
    finalRotation = currentRotation + Math.atan2(Math.sin(diff), Math.cos(diff));
    targetRotationRef.current = finalRotation + overshoot;
  };

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(max-width: 768px)");
    const update = () => {
      setIsMobile(media.matches);
      setViewportWidth(window.innerWidth);
    };

    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
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
    if (!projects.length) return;

    const initialVisible = isMobile
      ? []
      : projects.slice(0, 5);

    initialVisible
      .filter(Boolean)
      .forEach((project) => preloadVideo(project.video, { priority: "auto" }));

    const remainingSources = isMobile
      ? []
      : projects
          .filter((project) => !initialVisible.some((visible) => visible?.id === project.id))
          .map((project) => project.video);

    if (remainingSources.length) {
      preloadVideoBatch(remainingSources, { priority: "metadata", delay: 900 });
    }
  }, [isMobile, projects]);

  useEffect(() => {
    if (!sonicShuffleTick || projects.length === 0) return undefined;

    hideRandomButton();
    window.clearTimeout(shuffleTimerRef.current);

    const randomIndex = Math.floor(Math.random() * projects.length);
    if (isMobile) {
      rotateProjectToFront(randomIndex, 0);
      return undefined;
    }

    const spinDirection = Math.random() > 0.5 ? 1 : -1;
    rotateProjectToFront(randomIndex, spinDirection * 0.42);

    shuffleTimerRef.current = window.setTimeout(() => {
      rotateProjectToFront(randomIndex, 0);
    }, 240);

    return () => window.clearTimeout(shuffleTimerRef.current);
  }, [isMobile, sonicShuffleTick, projects]);

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

  const mobileItems = useMemo(() => {
    const total = projects.length || 1;
    const radiusX = viewportWidth * 0.64;
    const radiusY = 82;

    return projects.map((project, index) => {
      const angle = (index / total) * Math.PI * 2 + rotation;
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      const depth = (Math.sin(angle) + 1) / 2;
      const scale = 0.34 + depth * 0.82;
      const opacity = depth < 0.18 ? 0 : 0.18 + depth * 0.82;
      const zIndex = Math.round(depth * 100);
      const isFocused = depth > 0.86 && Math.abs(x) < radiusX * 0.42;

      return {
        depth,
        index,
        isFocused,
        project,
        style: {
          "--x": `${x}px`,
          "--y": `${y}px`,
          "--scale": scale,
          "--opacity": opacity,
          "--z": zIndex,
          pointerEvents: depth < 0.18 ? "none" : "auto",
        },
      };
    });
  }, [projects, rotation, viewportWidth]);

  const activeMobileItem = useMemo(() => {
    if (!mobileItems.length) return null;

    return mobileItems.reduce((front, item) =>
      item.depth > front.depth ? item : front
    );
  }, [mobileItems]);

  useEffect(() => {
    if (!projects.length) return;

    if (isMobile) {
      if (!activeMobileItem) return;

      const current = activeMobileItem.project;
      const prev = projects[(activeMobileItem.index - 1 + projects.length) % projects.length];
      const next = projects[(activeMobileItem.index + 1) % projects.length];

      [current, prev, next].forEach((project) =>
        preloadVideo(project?.video, {
          priority: project?.id === current?.id ? "auto" : "metadata",
        })
      );
      return;
    }

    if (!items.length) return;

    const focusedItem = items.reduce((closest, item) =>
      item.style.zIndex > closest.style.zIndex ? item : closest
    );

    const current = projects[focusedItem.index];
    const prev = projects[(focusedItem.index - 1 + projects.length) % projects.length];
    const next = projects[(focusedItem.index + 1) % projects.length];
    const nextTwo = projects[(focusedItem.index + 2) % projects.length];

    [current, prev, next].forEach((project) =>
      preloadVideo(project?.video, { priority: "auto" })
    );
    preloadVideoBatch([nextTwo?.video], { priority: "metadata", delay: 220 });
  }, [activeMobileItem, isMobile, items, projects]);

  const handleMobileTouchStart = (event) => {
    mobileTouchLastXRef.current = event.touches[0]?.clientX ?? 0;
    mobileTouchMovedRef.current = false;
  };

  const handleMobileTouchMove = (event) => {
    const currentX = event.touches[0]?.clientX ?? mobileTouchLastXRef.current;
    const delta = currentX - mobileTouchLastXRef.current;

    if (Math.abs(delta) > 1) {
      mobileTouchMovedRef.current = true;
    }

    mobileTouchLastXRef.current = currentX;
    rotationRef.current += delta * 0.01;
    targetRotationRef.current = rotationRef.current;
    setRotation(rotationRef.current);
  };

  const handleMobileTouchEnd = () => {
    window.setTimeout(() => {
      mobileTouchMovedRef.current = false;
    }, 120);
  };

  const renderMobileGallery = () => {
    return (
      <>
        <div
          className="mobile-carousel-container"
          onTouchStart={handleMobileTouchStart}
          onTouchMove={handleMobileTouchMove}
          onTouchEnd={handleMobileTouchEnd}
        >
          {mobileItems.map(({ index, isFocused, project, style }) => (
              <button
                key={project.id}
                type="button"
                className="mobile-video-card"
                style={style}
                onClick={(event) => {
                  if (mobileTouchMovedRef.current) return;

                  const rect = event.currentTarget.getBoundingClientRect();
                  preloadVideo(project.video, { priority: "auto" });

                  if (!isFocused && activeMobileItem?.project.id !== project.id) {
                    rotateProjectToFront(index, 0);
                    return;
                  }

                  onProjectSelect(project.id, rect);
                }}
              >
                {project.video || project.cover ? (
                  <video
                    src={project.video}
                    poster={project.cover}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload={isFocused || activeMobileItem?.project.id === project.id ? "auto" : "metadata"}
                    ref={(video) => {
                      if (!video) return;
                      video.muted = true;
                      video.playsInline = true;
                      void video.play().catch(() => {});
                    }}
                  />
                ) : (
                  <div className="video-wheel-fallback">{project.title}</div>
                )}
              </button>
          ))}
        </div>

        {activeMobileItem ? (
          <div className="mobile-active-title">{activeMobileItem.project.title}</div>
        ) : null}
      </>
    );
  };

  const renderDesktopWheel = () => (
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
              preloadVideo(project.video, { priority: "auto" });
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
  );

  return (
    <section className="video-wheel-section">
      {isMobile ? renderMobileGallery() : renderDesktopWheel()}
    </section>
  );
}
