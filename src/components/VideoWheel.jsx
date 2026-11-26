import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AudioKeys from "./AudioKeys";
import RandomPlayButton from "./RandomPlayButton";
import {
  optimizeVideoSrc,
  preloadVideo,
  preloadVideoBatch,
} from "../utils/videoPreload";
import { useTextEncoding } from "../utils/useTextEncoding";
import { initCarouselTick, playCarouselTick } from "../utils/carouselTick";

// ── Carousel tuning ──────────────────────────────────────────────────────────
// Size of the centred item relative to the previous base width (28vw, 288–560px).
// It is still capped so it never reaches the piano, the hint, the title or the index button.
const LINE_PEAK_SCALE = 1.42;
// How steeply neighbours shrink away from the centre (higher = steeper).
// With 0.72: centre 1.0 → ±1 ≈ 0.62 → ±2 ≈ 0.40 → ±3 ≈ 0.31.
const LINE_FALLOFF = 0.72;

// Mobile (max-width: 768px): same line, only sizing/spacing differ.
// Centred item ≈ 62% of the viewport width; first neighbours tuck slightly behind it
// so about half of each stays visible, the next ones peek at the edges.
const MOBILE_PEAK_VW = 0.62;
const MOBILE_FALLOFF = 1.2; // centre 1.0 → ±1 ≈ 0.45 → ±2 ≈ 0.27
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
const LINE_FALLOFF_SHAPE = 1.2; // > 1 keeps the curve smooth (flat) right at the centre
const LINE_BASE_WIDTH = (viewportWidth) => Math.min(Math.max(viewportWidth * 0.28, 288), 560);

// minScale: floor the outer items approach. spacing: weight of the scale integral in the
// position (1 = neighbours never overlap). gap: constant gap, as a fraction of the item width.
const DESKTOP_LINE = { minScale: 0.26, falloff: LINE_FALLOFF, spacing: 1, gap: 0.08 };
const MOBILE_LINE = { minScale: 0.22, falloff: MOBILE_FALLOFF, spacing: 0.5, gap: 0.15 };

const lineScale = (distance, line = DESKTOP_LINE) =>
  line.minScale +
  (1 - line.minScale) * Math.exp(-line.falloff * Math.pow(distance, LINE_FALLOFF_SHAPE));

// Horizontal position = integral of the scale (Simpson's rule) plus a constant gap.
const linePosition = (distance, line = DESKTOP_LINE) => {
  if (distance <= 0) return 0;
  const steps = 16;
  const h = distance / steps;
  let sum = lineScale(0, line) + lineScale(distance, line);
  for (let i = 1; i < steps; i += 1) {
    sum += (i % 2 ? 4 : 2) * lineScale(i * h, line);
  }
  return line.spacing * ((sum * h) / 3) + distance * line.gap;
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
  const shuffleTimerRef = useRef(0);
  const dizzyTimerRef = useRef(0);
  const fastTimerRef = useRef(null);
  const lastMoveTimeRef = useRef(0);
  const highlightedProjectRef = useRef(null);
  const highlightUpdateTimeRef = useRef(0);
  const touchDragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const wheelSnapTimerRef = useRef(0);
  const hasInitialSnapRef = useRef(false);
  const highlightRetryTimerRef = useRef(0);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [showRandomButton, setShowRandomButton] = useState(false);
  const [isDizzy, setIsDizzy] = useState(false);
  const [isDraggingFast, setIsDraggingFast] = useState(false);
  const [isCarouselMoving, setIsCarouselMoving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
    if (!projects.length) return;
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
    const spinDirection = Math.random() > 0.5 ? 1 : -1;
    rotateProjectToFront(randomIndex, spinDirection * 0.42);

    shuffleTimerRef.current = window.setTimeout(() => {
      rotateProjectToFront(randomIndex, 0);
    }, 240);

    return () => window.clearTimeout(shuffleTimerRef.current);
  }, [isMobile, sonicShuffleTick, projects]);

  // Peak (centred) item size: LINE_PEAK_SCALE × base width (MOBILE_PEAK_VW on mobile),
  // capped by the free space so it never reaches the surrounding UI.
  useEffect(() => {
    const measure = () => {
      const frame = wheelRef.current;
      if (!frame) return;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (isMobile) {
        // Mobile: between the nav above and the title / piano / index button below.
        const frameRect = frame.getBoundingClientRect();
        const centerY = frameRect.top + frameRect.height / 2;
        const nav = document.querySelector(".minimal-menu")?.getBoundingClientRect();
        const below = [".video-wheel-section .carousel-highlighted-title", ".background-toggle", ".titles-index-toggle"]
          .map((selector) => document.querySelector(selector)?.getBoundingClientRect())
          .filter((rect) => rect?.height)
          .map((rect) => rect.top);
        const margin = 12;
        const halfAbove = centerY - (nav?.bottom ?? 0) - margin;
        const halfBelow = Math.min(viewportHeight, ...below) - centerY - margin;
        const maxHeight = Math.max(100, 2 * Math.min(halfAbove, halfBelow));
        const width = Math.min(viewportWidth * MOBILE_PEAK_VW, (maxHeight * 16) / 9);
        setPeakWidth((current) => (Math.abs(current - width) < 1 ? current : width));
        return;
      }

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
    const line = isMobile ? MOBILE_LINE : DESKTOP_LINE;

    return projects
      .map((project, index) => {
        const baseAngle = (index / total) * Math.PI * 2;
        const angle = baseAngle + rotation;
        // Distance (in items) from the centre of the line, wrapped so the line is endless.
        const wrapped = Math.atan2(Math.sin(angle - Math.PI / 2), Math.cos(angle - Math.PI / 2));
        const offset = (-wrapped * total) / (Math.PI * 2);
        const distance = Math.abs(offset);
        const x = Math.sign(offset) * linePosition(distance, line) * itemWidth;
        const scale = lineScale(distance, line);
        const depth = 1 - Math.min(distance / maxVisibleOffset, 1);
        const opacity = distance < 3.6 ? 1 : Math.max(0, 1 - (distance - 3.6) / 0.6);
        const zIndex = Math.round(depth * 100);
        const isFocused = distance < 0.5;
        const isPrepared = distance < 1.6;

        const transform = isExpanded
          ? `translate3d(calc(-50% + ${x}px), 0, 0) scale(${scale})`
          : "translate3d(-50%, 0, 0) scale(0.65)";
        const itemOpacity = isExpanded ? opacity : 0.94;

        return {
          index,
          x,
          distance,
          project,
          style: {
            "--depth": depth,
            "--intro-delay": isExpanded ? "0ms" : `${index * 40}ms`,
            // Mirrored as variables so the mobile stylesheet can apply them over its old !important rules.
            "--item-transform": transform,
            "--item-opacity": itemOpacity,
            "--item-z": zIndex,
            transform,
            opacity: itemOpacity,
            zIndex,
          },
          isFocused,
          isPrepared,
        };
      })
      .filter((item) => item.distance <= maxVisibleOffset);
  }, [projects, rotation, isExpanded, peakWidth, isMobile]);

  const desktopActiveProject = useMemo(() => {
    if (!items.length) return null;

    return items.reduce((closest, item) =>
      item.style.zIndex > closest.style.zIndex ? item : closest
    ).project;
  }, [items]);

  // Carousel tick: one short click each time a different item becomes active.
  const tickActiveIdRef = useRef(null);

  useEffect(() => {
    initCarouselTick();
  }, []);

  const activeProjectId = desktopActiveProject?.id;

  useEffect(() => {
    // A new list (e.g. switching to Selected Work) is not a move: don't tick for the swap.
    tickActiveIdRef.current = activeProjectId ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  useEffect(() => {
    if (!activeProjectId) return;
    if (tickActiveIdRef.current !== null && tickActiveIdRef.current !== activeProjectId) {
      playCarouselTick();
    }
    tickActiveIdRef.current = activeProjectId;
  }, [activeProjectId]);

  useEffect(() => {
    if (!desktopActiveProject) return;
    updateHighlightedProject(desktopActiveProject);
  }, [desktopActiveProject, updateHighlightedProject]);

  useEffect(() => {
    window.clearTimeout(ambientHoverTimerRef.current);

    // Background video follows the item in the centre of the line.
    if (!desktopActiveProject || isCarouselMoving) {
      onAmbientPreview?.(null);
      return undefined;
    }

    ambientHoverTimerRef.current = window.setTimeout(() => {
      onAmbientPreview?.(desktopActiveProject);
    }, 2000);

    return () => window.clearTimeout(ambientHoverTimerRef.current);
  }, [desktopActiveProject, isCarouselMoving, onAmbientPreview]);

  useEffect(
    () => () => {
      window.clearTimeout(ambientHoverTimerRef.current);
      onAmbientPreview?.(null);
    },
    [onAmbientPreview]
  );

  useEffect(() => {
    if (!projects.length) return;

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

  // Mobile: touch swipe moves the line (desktop keeps the mouse wheel).
  const handleTouchStart = (event) => {
    if (!isMobile || event.touches.length !== 1) return;
    touchDragRef.current = {
      x: event.touches[0].clientX,
      lastX: event.touches[0].clientX,
      time: performance.now(),
      lastTime: performance.now(),
      velocity: 0,
      startRotation: targetRotationRef.current,
      moved: false,
    };
  };

  const pixelsPerItem = () => Math.max(1, linePosition(1, MOBILE_LINE) * peakWidth);

  const handleTouchMove = (event) => {
    const drag = touchDragRef.current;
    if (!drag || !projects.length) return;
    const x = event.touches[0].clientX;
    const dx = x - drag.x;
    if (!drag.moved && Math.abs(dx) < 8) return;
    drag.moved = true;

    const now = performance.now();
    drag.velocity = (x - drag.lastX) / Math.max(1, now - drag.lastTime);
    drag.lastX = x;
    drag.lastTime = now;

    hideRandomButton();
    const step = (Math.PI * 2) / projects.length;
    targetRotationRef.current = drag.startRotation - (dx / pixelsPerItem()) * step;
  };

  const handleTouchEnd = () => {
    const drag = touchDragRef.current;
    touchDragRef.current = null;
    if (!drag?.moved || !projects.length) return;

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);

    // A quick flick carries on a little before settling on the nearest item.
    const step = (Math.PI * 2) / projects.length;
    const velocity = Math.abs(drag.velocity) > 0.35 ? drag.velocity : 0; // px/ms; ignore slow drags
    const fling = Math.max(-1.5, Math.min(1.5, (velocity * 120) / pixelsPerItem()));
    targetRotationRef.current -= fling * step;
    hideRandomButton();
    snapToNearestProject();
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

  const renderDesktopWheel = () => (
    <>
      <div
        className="video-wheel-frame"
        ref={wheelRef}
        style={{ "--wheel-item-width": `${peakWidth.toFixed(1)}px` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className={`video-wheel video-wheel-container ${
            isCarouselMoving ? "is-moving" : ""
          }`}
        >
          {items.map(({ project, style, index, isFocused, isPrepared }) => (
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
                if (suppressClickRef.current) return;
                // Mobile: tapping a side item brings it to the centre; tapping the centre opens it.
                if (isMobile && !isFocused) {
                  hideRandomButton();
                  rotateProjectToFront(index);
                  return;
                }
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

        {projects.length > 0 && !isMobile ? (
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

      {isMobile ? <AudioKeys onKeyPlay={onKeyPlay} octaves={1} /> : null}
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

        {isMobile ? <AudioKeys onKeyPlay={onKeyPlay} octaves={1} /> : null}
      </>
    );
  };

  return (
    <section className="video-wheel-section">
      {projects.length === 1 ? renderSingleProject() : renderDesktopWheel()}
    </section>
  );
}
