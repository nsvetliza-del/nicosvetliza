import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RandomPlayButton from "./RandomPlayButton";
import {
  optimizeVideoSrc,
  preloadVideo,
  preloadVideoBatch,
  preloadVideoLink,
} from "../utils/videoPreload";

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
      const prev = projects[(index - 1 + projects.length) % projects.length];
      const current = projects[index];
      const next = projects[(index + 1) % projects.length];

      [prev, current, next].forEach((project) => preloadVideoLink(project?.video));

      mobileItemRefs.current.forEach((element, itemIndex) => {
        const video = element?.querySelector("video");
        if (!video) return;

        if (itemIndex === index) {
          video.preload = "auto";
          video.muted = true;
          video.playsInline = true;
          void video.play().catch(() => {});
          return;
        }

        video.pause();
        video.preload = "metadata";
      });
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

    const radiusX = window.innerWidth * 0.64;
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
      const depth = (Math.sin(angle) + 1) / 2;
      const scale = 0.25 + Math.pow(depth, 3.2) * 1.35;
      const opacity = 0.35 + depth * 0.65;
      const zIndex = Math.round(depth * 100);

      element.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      element.style.opacity = String(opacity);
      element.style.zIndex = String(zIndex);

      const video = element.querySelector("video");
      if (!video) return;

      const source = video.dataset.src;
      const isNearFront = angleDistanceToFront < 1.2;
      const isFront = index === frontIndex;
      const hasSource = Boolean(video.getAttribute("src"));

      if (isNearFront && source && !hasSource) {
        video.src = source;
        video.preload = isFront ? "auto" : "metadata";
        video.load();
      } else if (isFront && hasSource && video.preload !== "auto") {
        video.preload = "auto";
      } else if (!isFront && hasSource && video.preload !== "metadata") {
        video.preload = "metadata";
      }

      if (!isNearFront && hasSource) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }

      const nextFrontState = isFront ? "true" : "false";
      if (video.dataset.front !== nextFrontState) {
        video.dataset.front = nextFrontState;

        if (isFront && source) {
          if (!video.getAttribute("src")) {
            video.src = source;
            video.preload = "auto";
            video.load();
          }

          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });

    updateMobileActiveTitle(frontIndex);
  }, [getMobileFrontIndex, projects, updateMobileActiveTitle]);

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
      preloadVideo(project?.video, { priority: "auto" })
    );
    preloadVideoBatch([nextTwo?.video], { priority: "metadata", delay: 220 });
  }, [isMobile, items, projects]);

  useEffect(() => {
    if (!isMobile || !projects.length) return undefined;

    updateMobileWheel();
    updateMobileActiveTitle(getMobileFrontIndex(), true);

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
  }, [getMobileFrontIndex, isMobile, projects.length, updateMobileActiveTitle, updateMobileWheel]);

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

    if (Math.abs(deltaX) > 1) {
      mobileTouchMovedRef.current = true;
    }

    mobileTouchLastXRef.current = currentX;
    mobileVelocityRef.current = -deltaX * 0.0022;
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
              const optimizedSrc = optimizeVideoSrc(project.video);

              return (
              <button
                key={project.id}
                type="button"
                className="mobile-video-card"
                ref={(element) => {
                  mobileItemRefs.current[index] = element;
                }}
                onClick={(event) => {
                  if (mobileTouchMovedRef.current) return;

                  const rect = event.currentTarget.getBoundingClientRect();
                  preloadVideo(project.video, { priority: "auto" });

                  if (mobileActiveIndexRef.current !== index) {
                    rotateProjectToFront(index, 0);
                    return;
                  }

                  onProjectSelect(project.id, rect);
                }}
              >
                {project.video || project.cover ? (
                  <video
                    data-src={optimizedSrc}
                    poster={project.cover}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    ref={(video) => {
                      if (!video) return;
                      video.muted = true;
                      video.playsInline = true;
                    }}
                  />
                ) : (
                  <div className="video-wheel-fallback">{project.title}</div>
                )}
              </button>
              );
            })()
          ))}
        </div>

        <button
          type="button"
          className="mobile-random-button"
          onClick={handleMobileRandom}
          aria-label="Random project"
        >
          ⤨
        </button>

        {mobileActiveTitle ? (
          <div className="mobile-active-title">{mobileActiveTitle}</div>
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
