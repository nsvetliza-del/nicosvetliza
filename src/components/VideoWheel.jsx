import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AudioKeys from "./AudioKeys";
import RandomPlayButton from "./RandomPlayButton";
import {
  optimizeVideoSrc,
  preloadVideo,
  preloadVideoBatch,
  preloadVideoLink,
} from "../utils/videoPreload";
import { useTextEncoding } from "../utils/useTextEncoding";

// ── Carousel tuning ──────────────────────────────────────────────────────────
// Size of the centred item relative to the previous base width (28vw, 288–560px).
// It is still capped so it never reaches the piano, the hint, the title or the index button.
const LINE_PEAK_SCALE = 1.42;
// How steeply neighbours shrink away from the centre (higher = steeper).
// With 0.72: centre 1.0 → ±1 ≈ 0.62 → ±2 ≈ 0.40 → ±3 ≈ 0.31.
const LINE_FALLOFF = 0.72;
// ─────────────────────────────────────────────────────────────────────────────

// Full-quality file for the active item only. Mounted lazily, fades in over
// the preview once it plays, and drops its download when unmounted.
function FullQualityVideo({ src }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    video.src = src;
    void video.play().catch(() => {});
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className={`video-wheel-video-full ${isPlaying ? "is-playing" : ""}`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onPlaying={() => setIsPlaying(true)}
    />
  );
}

// Flat line: scale falls off smoothly and continuously with distance from the centre.
const LINE_MIN_SCALE = 0.26; // floor the outer items approach
const LINE_FALLOFF_SHAPE = 1.2; // > 1 keeps the curve smooth (flat) right at the centre
const LINE_GAP = 0.08; // constant gap between neighbours, as a fraction of the item width
const LINE_BASE_WIDTH = (viewportWidth) => Math.min(Math.max(viewportWidth * 0.28, 288), 560);

const lineScale = (distance) =>
  LINE_MIN_SCALE +
  (1 - LINE_MIN_SCALE) * Math.exp(-LINE_FALLOFF * Math.pow(distance, LINE_FALLOFF_SHAPE));

// Horizontal position = integral of the scale (Simpson's rule), so neighbours never overlap.
const linePosition = (distance) => {
  if (distance <= 0) return 0;
  const steps = 16;
  const h = distance / steps;
  let sum = lineScale(0) + lineScale(distance);
  for (let i = 1; i < steps; i += 1) {
    sum += (i % 2 ? 4 : 2) * lineScale(i * h);
  }
  return (sum * h) / 3;
};

export default function VideoWheel({
  projects,
  onProjectSelect,
  launchingProjectId = null,
  isReady = true,
  sonicShuffleTick = 0,
  onAmbientPreview = null,
  onKeyPlay = null,
}) {
  const wheelRef = useRef(null);
  const [peakWidth, setPeakWidth] = useState(() =>
    LINE_BASE_WIDTH(typeof window === "undefined" ? 1440 : window.innerWidth) * LINE_PEAK_SCALE
  );
  const frameRef = useRef(0);
  const randomTimerRef = useRef(0);
  const ambientHoverTimerRef = useRef(0);
  const mobileAmbientTimerRef = useRef(0);
  const shuffleTimerRef = useRef(0);
  const dizzyTimerRef = useRef(0);
  const fastTimerRef = useRef(null);
  const lastMoveTimeRef = useRef(0);
  const highlightedProjectRef = useRef(null);
  const highlightUpdateTimeRef = useRef(0);
  const mobileItemRefs = useRef([]);
  const mobileScrollRef = useRef(null);
  const mobileActiveIndexRef = useRef(0);
  const mobileScrollTimerRef = useRef(0);
  const wheelSnapTimerRef = useRef(0);
  const hasInitialSnapRef = useRef(false);
  const highlightRetryTimerRef = useRef(0);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [showRandomButton, setShowRandomButton] = useState(false);
  const [isDizzy, setIsDizzy] = useState(false);
  const [isDraggingFast, setIsDraggingFast] = useState(false);
  const [isCarouselMoving, setIsCarouselMoving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileInteracting, setIsMobileInteracting] = useState(false);
  const [highlightedProject, setHighlightedProject] = useState(null);
  const {
    text: encodedTitle,
    isEncoding: isEncodingTitle,
    start: startEncoding,
  } = useTextEncoding();

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
    startEncoding(title);
  }, [startEncoding]);

  const updateHighlightedProject = useCallback(
    (project, immediate = false) => {
      if (!project || highlightedProjectRef.current?.id === project.id) return;
      if (typeof window === "undefined") return;

      const now = performance.now();
      window.clearTimeout(highlightRetryTimerRef.current);
      const elapsed = now - highlightUpdateTimeRef.current;
      if (!immediate && elapsed < 120) {
        // Throttled: retry once the window ends so the title never goes stale.
        highlightRetryTimerRef.current = window.setTimeout(
          () => updateHighlightedProject(project),
          120 - elapsed
        );
        return;
      }

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

  // Curved line: settle on the nearest item so one item always sits in the centre.
  const snapToNearestProject = () => {
    const total = projects.length;
    if (!total) return;
    const step = (Math.PI * 2) / total;
    const nearestIndex =
      ((Math.round((Math.PI / 2 - targetRotationRef.current) / step) % total) + total) % total;
    rotateProjectToFront(nearestIndex);
  };

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
    window.clearTimeout(highlightRetryTimerRef.current);
  }, []);

  useEffect(() => {
    const element = wheelRef.current;
    if (!element || isMobile) return undefined;

    const handleWheel = (event) => {
      event.preventDefault();
      hideRandomButton();
      triggerDizzyIfFast(event.deltaY);
      targetRotationRef.current += event.deltaY * 0.0011;
      window.clearTimeout(wheelSnapTimerRef.current);
      wheelSnapTimerRef.current = window.setTimeout(snapToNearestProject, 180);
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", handleWheel);
      window.clearTimeout(wheelSnapTimerRef.current);
    };
  }, [isMobile, triggerDizzyIfFast, projects]);

  useEffect(() => {
    if (isMobile || !projects.length) return;
    // Every load (and every new list) starts on the first piece.
    rotateProjectToFront(0);
    if (!hasInitialSnapRef.current) {
      // First layout: start already aligned instead of sliding into place.
      hasInitialSnapRef.current = true;
      rotationRef.current = targetRotationRef.current;
      setRotation(rotationRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, projects]);

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
      mobileItemRefs.current[randomIndex]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      return undefined;
    }

    const spinDirection = Math.random() > 0.5 ? 1 : -1;
    rotateProjectToFront(randomIndex, spinDirection * 0.42);

    shuffleTimerRef.current = window.setTimeout(() => {
      rotateProjectToFront(randomIndex, 0);
    }, 240);

    return () => window.clearTimeout(shuffleTimerRef.current);
  }, [isMobile, sonicShuffleTick, projects]);

  // Peak (centred) item size: LINE_PEAK_SCALE × base width, capped by the free space
  // between the piano above and the hint/title/index button below.
  useEffect(() => {
    if (isMobile) return undefined;

    const measure = () => {
      const frame = wheelRef.current;
      if (!frame) return;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const desired = LINE_BASE_WIDTH(viewportWidth) * LINE_PEAK_SCALE;

      const frameRect = frame.getBoundingClientRect();
      const centerY = frameRect.top + frameRect.height / 2;
      const piano = document.querySelector(".audio-keys-wrap")?.getBoundingClientRect();
      const title = document.querySelector(".video-wheel-section .carousel-highlighted-title")?.getBoundingClientRect();
      const indexButton = document.querySelector(".titles-index-toggle")?.getBoundingClientRect();
      const hint = frame.querySelector(".random-play-button")?.getBoundingClientRect();
      const hintSpace = 1.6 * 16 + (hint?.height || 14); // gap under the item + hint line
      const margin = 16;

      const topLimit = piano ? piano.bottom : 0;
      const bottomLimit = Math.min(
        title?.height ? title.top : viewportHeight - 48,
        indexButton?.height ? indexButton.top : viewportHeight
      );
      const halfAbove = centerY - topLimit - margin;
      const halfBelow = bottomLimit - centerY - hintSpace - margin;
      const maxHeight = Math.max(120, 2 * Math.min(halfAbove, halfBelow));
      const width = Math.min(desired, (maxHeight * 16) / 9, viewportWidth * 0.9);

      setPeakWidth((current) => (Math.abs(current - width) < 1 ? current : width));
    };

    measure();
    const settleTimer = window.setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", measure);
    };
  }, [isMobile, isExpanded, Boolean(highlightedProject)]);

  const items = useMemo(() => {
    const total = projects.length || 1;
    // Items are laid out at the peak width (set on the frame as --wheel-item-width).
    const itemWidth = peakWidth;
    const maxVisibleOffset = 4.6;

    return projects
      .map((project, index) => {
        const baseAngle = (index / total) * Math.PI * 2;
        const angle = baseAngle + rotation;
        // Distance (in items) from the centre of the line, wrapped so the line is endless.
        const wrapped = Math.atan2(Math.sin(angle - Math.PI / 2), Math.cos(angle - Math.PI / 2));
        const offset = (-wrapped * total) / (Math.PI * 2);
        const distance = Math.abs(offset);
        const x = Math.sign(offset) * (linePosition(distance) + distance * LINE_GAP) * itemWidth;
        const scale = lineScale(distance);
        const depth = 1 - Math.min(distance / maxVisibleOffset, 1);
        const opacity = distance < 3.6 ? 1 : Math.max(0, 1 - (distance - 3.6) / 0.6);
        const zIndex = Math.round(depth * 100);
        const isFocused = distance < 0.5;
        const isPrepared = distance < 1.6;

        return {
          index,
          x,
          distance,
          project,
          style: {
            "--depth": depth,
            "--intro-delay": isExpanded ? "0ms" : `${index * 40}ms`,
            transform: isExpanded
              ? `translate3d(calc(-50% + ${x}px), 0, 0) scale(${scale})`
              : "translate3d(-50%, 0, 0) scale(0.65)",
            opacity: isExpanded ? opacity : 0.94,
            zIndex,
          },
          isFocused,
          isPrepared,
        };
      })
      .filter((item) => item.distance <= maxVisibleOffset);
  }, [projects, rotation, isExpanded, peakWidth]);

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
    window.clearTimeout(ambientHoverTimerRef.current);

    // Background video follows the item in the centre of the line.
    if (isMobile || !desktopActiveProject || isCarouselMoving) {
      onAmbientPreview?.(null);
      return undefined;
    }

    ambientHoverTimerRef.current = window.setTimeout(() => {
      onAmbientPreview?.(desktopActiveProject);
    }, 2000);

    return () => window.clearTimeout(ambientHoverTimerRef.current);
  }, [desktopActiveProject, isCarouselMoving, isMobile, onAmbientPreview]);

  useEffect(() => {
    window.clearTimeout(mobileAmbientTimerRef.current);

    if (!isMobile) return undefined;

    if (!highlightedProject || isMobileInteracting) {
      onAmbientPreview?.(null);
      return undefined;
    }

    mobileAmbientTimerRef.current = window.setTimeout(() => {
      onAmbientPreview?.(highlightedProject);
    }, 2000);

    return () => window.clearTimeout(mobileAmbientTimerRef.current);
  }, [highlightedProject, isMobile, isMobileInteracting, onAmbientPreview]);

  useEffect(
    () => () => {
      window.clearTimeout(ambientHoverTimerRef.current);
      window.clearTimeout(mobileAmbientTimerRef.current);
      onAmbientPreview?.(null);
    },
    [onAmbientPreview]
  );

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

    const container = mobileScrollRef.current;
    if (!container) return undefined;

    const updateActiveFromScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestIndex = mobileActiveIndexRef.current;
      let smallestDistance = Infinity;

      mobileItemRefs.current.forEach((element, index) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - containerCenter);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex === mobileActiveIndexRef.current) return;

      mobileActiveIndexRef.current = closestIndex;
      setMobileActiveIndex(closestIndex);
      updateHighlightedProject(projects[closestIndex]);

      const prev = projects[(closestIndex - 1 + projects.length) % projects.length];
      const next = projects[(closestIndex + 1) % projects.length];
      [prev, next].forEach((project) =>
        preloadVideoLink(project?.previewVideo || project?.video)
      );
    };

    let scrollFrame = 0;
    const handleScroll = () => {
      setIsMobileInteracting(true);
      window.clearTimeout(mobileScrollTimerRef.current);

      if (!scrollFrame) {
        scrollFrame = window.requestAnimationFrame(() => {
          scrollFrame = 0;
          updateActiveFromScroll();
        });
      }

      mobileScrollTimerRef.current = window.setTimeout(() => {
        setIsMobileInteracting(false);
      }, 160);
    };

    // A new list starts on its first piece.
    container.scrollLeft = 0;
    mobileActiveIndexRef.current = 0;
    setMobileActiveIndex(0);
    updateHighlightedProject(projects[0], true);
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(scrollFrame);
      window.clearTimeout(mobileScrollTimerRef.current);
    };
  }, [isMobile, projects, updateHighlightedProject]);

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
        <div className="mobile-video-gallery" ref={mobileScrollRef}>
          <div className="mobile-video-track">
            {projects.map((project, index) => {
              const videoSrc = project.previewVideo || project.video;

              return (
                <button
                  key={project.id}
                  type="button"
                  className={`mobile-video-card ${
                    index === mobileActiveIndex ? "is-active" : ""
                  }`}
                  aria-label={project.title}
                  ref={(element) => {
                    mobileItemRefs.current[index] = element;
                  }}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    preloadVideo(project.fullVideo || videoSrc, { priority: "auto" });

                    if (mobileActiveIndexRef.current !== index) {
                      event.currentTarget.scrollIntoView({
                        behavior: "smooth",
                        inline: "center",
                        block: "nearest",
                      });
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
                  {videoSrc &&
                  project.fullVideo &&
                  index === mobileActiveIndex &&
                  !isMobileInteracting ? (
                    <FullQualityVideo key={project.id} src={project.fullVideo} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {renderHighlightedTitle()}

        <AudioKeys onKeyPlay={onKeyPlay} />
      </>
    );
  };

  const renderDesktopWheel = () => (
    <>
      <div
        className="video-wheel-frame"
        ref={wheelRef}
        style={{ "--wheel-item-width": `${peakWidth.toFixed(1)}px` }}
      >
        <div
          className={`video-wheel video-wheel-container ${
            isCarouselMoving ? "is-moving" : ""
          }`}
        >
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
                {isFocused && !isCarouselMoving && project.fullVideo ? (
                  <FullQualityVideo key={project.id} src={project.fullVideo} />
                ) : null}
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

        {isMobile ? <AudioKeys onKeyPlay={onKeyPlay} /> : null}
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
