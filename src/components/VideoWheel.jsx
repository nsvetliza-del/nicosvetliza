import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AudioKeys from "./AudioKeys";
import RandomPlayButton from "./RandomPlayButton";
import {
  optimizeVideoSrc,
  preloadVideo,
  preloadVideoBatch,
  preloadVideoLink,
} from "../utils/videoPreload";

const randomTitleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#<>_-.";

const encodeTitle = (title) =>
  title
    .split("")
    .map((char) =>
      char === " "
        ? " "
        : randomTitleChars[Math.floor(Math.random() * randomTitleChars.length)]
    )
    .join("");

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
  const dizzyTimerRef = useRef(0);
  const fastTimerRef = useRef(null);
  const lastMoveTimeRef = useRef(0);
  const titleEncodingTimerRef = useRef(null);
  const titleEncodingIntervalRef = useRef(null);
  const highlightedProjectRef = useRef(null);
  const highlightUpdateTimeRef = useRef(0);
  const mobileTouchLastXRef = useRef(0);
  const mobileTouchMovedRef = useRef(false);
  const mobileItemRefs = useRef([]);
  const mobileFrameRef = useRef(0);
  const mobileActiveIndexRef = useRef(0);
  const mobileActiveTitleRef = useRef("");
  const mobileActiveTitleTimerRef = useRef(0);
  const mobileSnapTimerRef = useRef(0);
  const mobileVelocityRef = useRef(0);
  const isMobileDraggingRef = useRef(false);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [mobileActiveTitle, setMobileActiveTitle] = useState("");
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [showRandomButton, setShowRandomButton] = useState(false);
  const [isDizzy, setIsDizzy] = useState(false);
  const [isDraggingFast, setIsDraggingFast] = useState(false);
  const [isCarouselMoving, setIsCarouselMoving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [highlightedProject, setHighlightedProject] = useState(null);
  const [encodedTitle, setEncodedTitle] = useState("");
  const [isEncodingTitle, setIsEncodingTitle] = useState(false);

  const hideRandomButton = () => {
    setIsCarouselMoving(true);
    setShowRandomButton(false);
    window.clearTimeout(randomTimerRef.current);
    randomTimerRef.current = window.setTimeout(() => {
      setIsCarouselMoving(false);
      setShowRandomButton(true);
    }, 700);
  };

  const triggerDizzyIfFast = useCallback((delta) => {
    if (typeof window === "undefined") return;

    const now = performance.now();
    const previousMoveTime = lastMoveTimeRef.current || now;
    const dt = Math.max(16, now - previousMoveTime);
    const velocity = Math.abs(delta) / dt;

    lastMoveTimeRef.current = now;

    if (velocity > 1.2) {
      setIsDraggingFast(true);
      setIsDizzy(false);
      window.clearTimeout(fastTimerRef.current);
      window.clearTimeout(dizzyTimerRef.current);

      fastTimerRef.current = window.setTimeout(() => {
        setIsDraggingFast(false);
        setIsDizzy(true);

        dizzyTimerRef.current = window.setTimeout(() => {
          setIsDizzy(false);
        }, 2000);
      }, 180);
    }
  }, []);

  const startTitleEncoding = useCallback((project) => {
    if (!project) return;

    const title = project.title ?? "";

    highlightedProjectRef.current = project;
    setHighlightedProject(project);
    setIsEncodingTitle(true);
    setEncodedTitle(encodeTitle(title));

    window.clearTimeout(titleEncodingTimerRef.current);
    window.clearInterval(titleEncodingIntervalRef.current);

    titleEncodingIntervalRef.current = window.setInterval(() => {
      setEncodedTitle(encodeTitle(title));
    }, 45);

    titleEncodingTimerRef.current = window.setTimeout(() => {
      window.clearInterval(titleEncodingIntervalRef.current);
      titleEncodingIntervalRef.current = null;
      setEncodedTitle(title);
      setIsEncodingTitle(false);
    }, 620);
  }, []);

  const updateHighlightedProject = useCallback(
    (project, immediate = false) => {
      if (!project || highlightedProjectRef.current?.id === project.id) return;
      if (typeof window === "undefined") return;

      const now = performance.now();
      if (!immediate && now - highlightUpdateTimeRef.current < 120) return;

      highlightUpdateTimeRef.current = now;
      startTitleEncoding(project);
    },
    [startTitleEncoding]
  );

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

  const getMobileFrontIndex = useCallback(() => {
    const total = projects.length;
    if (!total) return 0;

    const frontAngle = Math.PI / 2;
    let frontIndex = 0;
    let smallestDistance = Infinity;

    projects.forEach((_, index) => {
      const baseAngle = (index / total) * Math.PI * 2;
      const angle = baseAngle + rotationRef.current;
      const distance = Math.abs(Math.atan2(
        Math.sin(angle - frontAngle),
        Math.cos(angle - frontAngle)
      ));

      if (distance < smallestDistance) {
        smallestDistance = distance;
        frontIndex = index;
      }
    });

    return frontIndex;
  }, [projects]);

  const updateMobileActiveTitle = useCallback((index, immediate = false) => {
    if (!projects[index]) return;
    if (mobileActiveIndexRef.current === index && mobileActiveTitleRef.current) return;

    mobileActiveIndexRef.current = index;
    window.clearTimeout(mobileActiveTitleTimerRef.current);

    const commitTitle = () => {
      const nextTitle = projects[index]?.title ?? "";
      mobileActiveTitleRef.current = nextTitle;
      setMobileActiveTitle(nextTitle);
      const current = projects[index];
      const prev = projects[(index - 1 + projects.length) % projects.length];
      const prevTwo = projects[(index - 2 + projects.length) % projects.length];
      const next = projects[(index + 1) % projects.length];
      const nextTwo = projects[(index + 2) % projects.length];

      [current, prev, next, prevTwo, nextTwo].forEach((project) =>
        preloadVideoLink(project?.previewVideo || project?.video)
      );
    };

    if (immediate) {
      commitTitle();
      return;
    }

    mobileActiveTitleTimerRef.current = window.setTimeout(commitTitle, 150);
  }, [projects]);

  const updateMobileWheel = useCallback(() => {
    const total = projects.length;
    if (!total) return;

    const radiusX = window.innerWidth * 0.54;
    const radiusY = 105;
    const frontIndex = getMobileFrontIndex();
    const frontAngle = Math.PI / 2;

    projects.forEach((_, index) => {
      const element = mobileItemRefs.current[index];
      if (!element) return;

      const baseAngle = (index / total) * Math.PI * 2;
      const angle = baseAngle + rotationRef.current;
      const angleDistanceToFront = Math.abs(Math.atan2(
        Math.sin(angle - frontAngle),
        Math.cos(angle - frontAngle)
      ));
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      const frontness = Math.max(0, 1 - angleDistanceToFront / 1.35);
      const scale = 0.34 + Math.pow(frontness, 3.0) * 2.0;
      const opacity = 0.3 + Math.pow(frontness, 1.1) * 0.7;
      const zIndex = Math.round(frontness * 1000);

      element.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      element.style.opacity = String(opacity);
      element.style.zIndex = String(zIndex);
    });

    updateHighlightedProject(projects[frontIndex]);
  }, [getMobileFrontIndex, projects, updateHighlightedProject]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(max-width: 768px)");
    const update = () => {
      setIsMobile(media.matches);
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
    if (isMobile) return undefined;

    const animate = () => {
      rotationRef.current += (targetRotationRef.current - rotationRef.current) * 0.11;
      setRotation(rotationRef.current);
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
    };
  }, [isMobile]);

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

  useEffect(() => () => {
    window.clearTimeout(fastTimerRef.current);
    window.clearTimeout(dizzyTimerRef.current);
    window.clearTimeout(titleEncodingTimerRef.current);
    window.clearInterval(titleEncodingIntervalRef.current);
  }, []);

  useEffect(() => {
    const element = wheelRef.current;
    if (!element || isMobile) return undefined;

    const handleWheel = (event) => {
      event.preventDefault();
      hideRandomButton();
      triggerDizzyIfFast(event.deltaY);
      targetRotationRef.current += event.deltaY * 0.0011;
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [isMobile, triggerDizzyIfFast]);

  useEffect(() => {
    if (!projects.length) return;

    const initialVisible = isMobile
      ? []
      : projects.slice(0, 5);

    initialVisible
      .filter(Boolean)
      .forEach((project) => preloadVideo(project.previewVideo || project.video, { priority: "auto" }));

    const remainingSources = isMobile
      ? []
      : projects
          .filter((project) => !initialVisible.some((visible) => visible?.id === project.id))
          .map((project) => project.previewVideo || project.video);

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
    const radiusX = Math.min(window.innerWidth * 0.28, 460);
    const radiusY = 150;

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

  const desktopActiveProject = useMemo(() => {
    if (!items.length) return null;

    return items.reduce((closest, item) =>
      item.style.zIndex > closest.style.zIndex ? item : closest
    ).project;
  }, [items]);

  useEffect(() => {
    if (isMobile || !desktopActiveProject) return;
    updateHighlightedProject(desktopActiveProject);
  }, [desktopActiveProject, isMobile, updateHighlightedProject]);

  useEffect(() => {
    if (!projects.length) return;

    if (isMobile) {
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
      preloadVideo(project?.previewVideo || project?.video, { priority: "auto" })
    );
    preloadVideoBatch([nextTwo?.previewVideo || nextTwo?.video], { priority: "metadata", delay: 220 });
  }, [isMobile, items, projects]);

  useEffect(() => {
    if (!isMobile || !projects.length) return undefined;

    updateMobileWheel();
    updateHighlightedProject(projects[getMobileFrontIndex()], true);

    const animate = () => {
      if (!isMobileDraggingRef.current) {
        rotationRef.current += (targetRotationRef.current - rotationRef.current) * 0.13;
      }

      updateMobileWheel();
      mobileFrameRef.current = window.requestAnimationFrame(animate);
    };

    mobileFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(mobileFrameRef.current);
    };
  }, [getMobileFrontIndex, isMobile, projects, updateHighlightedProject, updateMobileWheel]);

  useEffect(() => () => {
    window.clearTimeout(mobileActiveTitleTimerRef.current);
    window.clearTimeout(mobileSnapTimerRef.current);
  }, []);

  const handleMobilePointerDown = (event) => {
    event.preventDefault();
    window.clearTimeout(mobileSnapTimerRef.current);
    isMobileDraggingRef.current = true;
    mobileTouchLastXRef.current = event.clientX;
    mobileTouchMovedRef.current = false;
    mobileVelocityRef.current = 0;
    event.currentTarget.classList.add("is-dragging");
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleMobilePointerMove = (event) => {
    if (!isMobileDraggingRef.current) return;

    event.preventDefault();

    const currentX = event.clientX;
    const deltaX = currentX - mobileTouchLastXRef.current;
    triggerDizzyIfFast(deltaX);

    if (Math.abs(deltaX) > 1) {
      mobileTouchMovedRef.current = true;
    }

    mobileTouchLastXRef.current = currentX;
    mobileVelocityRef.current = -deltaX * 0.0017;
    rotationRef.current += mobileVelocityRef.current;
    targetRotationRef.current = rotationRef.current;
    updateMobileWheel();
  };

  const handleMobilePointerUp = (event) => {
    if (!isMobileDraggingRef.current) return;

    isMobileDraggingRef.current = false;
    event.currentTarget.classList.remove("is-dragging");
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    targetRotationRef.current = rotationRef.current + mobileVelocityRef.current * 18;

    window.clearTimeout(mobileSnapTimerRef.current);
    mobileSnapTimerRef.current = window.setTimeout(() => {
      rotateProjectToFront(getMobileFrontIndex(), 0);
    }, 260);

    window.setTimeout(() => {
      mobileTouchMovedRef.current = false;
    }, 120);
  };

  const handleMobilePointerCancel = (event) => {
    if (!isMobileDraggingRef.current) return;

    isMobileDraggingRef.current = false;
    event.currentTarget.classList.remove("is-dragging");
    rotateProjectToFront(getMobileFrontIndex(), 0);
  };

  const handleMobileRandom = () => {
    if (!projects.length) return;
    const randomIndex = Math.floor(Math.random() * projects.length);
    rotateProjectToFront(randomIndex, 0);
  };

  const highlightedTitleText = isEncodingTitle
    ? encodedTitle
    : highlightedProject?.title ?? "";

  const renderHighlightedTitle = () =>
    highlightedProject ? (
      <div
        className={`carousel-highlighted-title ${
          isEncodingTitle ? "is-encoding" : ""
        }`}
        data-encoding={isEncodingTitle ? "true" : "false"}
      >
        {highlightedTitleText}
      </div>
    ) : null;

  const renderMobileGallery = () => {
    return (
      <>
        <div
          className="mobile-carousel-container"
          onPointerDown={handleMobilePointerDown}
          onPointerMove={handleMobilePointerMove}
          onPointerUp={handleMobilePointerUp}
          onPointerCancel={handleMobilePointerCancel}
        >
          {projects.map((project, index) => (
            (() => {
              const videoSrc = project.previewVideo || project.video;

              return (
                <button
                  key={project.id}
                  type="button"
                  className="mobile-video-card"
                  aria-label={project.title}
                  ref={(element) => {
                    mobileItemRefs.current[index] = element;
                  }}
                  onClick={(event) => {
                    if (mobileTouchMovedRef.current) return;

                    const rect = event.currentTarget.getBoundingClientRect();
                    preloadVideo(project.fullVideo || videoSrc, { priority: "auto" });

                    if (mobileActiveIndexRef.current !== index) {
                      rotateProjectToFront(index, 0);
                      return;
                    }

                    onProjectSelect(project.id, rect);
                  }}
                >
                  {videoSrc ? (
                    <video
                      src={videoSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload={index < 6 ? "auto" : "metadata"}
                    />
                  ) : (
                    <div className="video-wheel-fallback" aria-hidden="true" />
                  )}
                </button>
              );
            })()
          ))}

          <button
            type="button"
            className={`mobile-random-button ${isDraggingFast ? "is-hidden-fast" : ""}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={handleMobileRandom}
            aria-label="Random project"
          >
            {isDizzy ? "I feel dizzy." : "click to open randomly"}
          </button>
        </div>

        {renderHighlightedTitle()}

        <AudioKeys />
      </>
    );
  };

  const renderDesktopWheel = () => (
    <>
      <div className="video-wheel-frame" ref={wheelRef}>
        <div className="video-wheel video-wheel-container">
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
                preloadVideo(project.previewVideo || project.video);
              }}
              onFocus={() => {
                setHoveredProjectId(project.id);
                preloadVideo(project.previewVideo || project.video);
              }}
              onMouseLeave={() => setHoveredProjectId(null)}
              onBlur={() => setHoveredProjectId(null)}
              onClick={(event) => {
                const mediaElement = event.currentTarget.querySelector(".video-wheel-media");
                const videoElement = mediaElement?.querySelector("video");
                preloadVideo(project.fullVideo || project.previewVideo || project.video, { priority: "auto" });
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
                  src={project.previewVideo || project.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload={isPrepared || hoveredProjectId === project.id ? "auto" : "metadata"}
                />
              </div>
            </button>
          ))}
        </div>

        {projects.length > 0 ? (
          <RandomPlayButton
            onClick={(event) => {
              const randomProject = projects[Math.floor(Math.random() * projects.length)];
              if (!randomProject) return;
              preloadVideo(randomProject.fullVideo || randomProject.previewVideo || randomProject.video);
              const rect = event.currentTarget.getBoundingClientRect();
              onProjectSelect(randomProject.id, rect);
            }}
            isVisible={showRandomButton && !isCarouselMoving}
            isDizzy={isDizzy}
            isDraggingFast={isDraggingFast}
          />
        ) : null}
      </div>

      {renderHighlightedTitle()}
    </>
  );

  const renderSingleProject = () => {
    const project = projects[0];
    if (!project) return null;

    return (
      <>
        <button
          type="button"
          className="single-video-project"
          onClick={(event) => {
            preloadVideo(project.fullVideo || project.previewVideo || project.video, { priority: "auto" });
            onProjectSelect(project.id, event.currentTarget.getBoundingClientRect());
          }}
          aria-label={`Open ${project.title}`}
        >
          <video
            className="single-video-project-media"
            src={project.previewVideo || project.video}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        </button>

        <div className="single-video-project-title">{project.title}</div>

        {isMobile ? <AudioKeys /> : null}
      </>
    );
  };

  return (
    <section className="video-wheel-section">
      {projects.length === 1
        ? renderSingleProject()
        : isMobile
          ? renderMobileGallery()
          : renderDesktopWheel()}
    </section>
  );
}
