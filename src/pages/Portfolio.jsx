import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EpicIntro from "../components/EpicIntro";
import ImmersivePlayer from "../components/ImmersivePlayer";
import AudioKeys from "../components/AudioKeys";
import MinimalMenu from "../components/MinimalMenu";
import VideoTransitionLayer from "../components/VideoTransitionLayer";
import VideoWheel from "../components/VideoWheel";
import { projects } from "../data/projects";

export default function Portfolio({ showIntro = false, initialCategory = "All" }) {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showIntroOverlay, setShowIntroOverlay] = useState(showIntro);
  const [transitionState, setTransitionState] = useState(null);
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [filterPhase, setFilterPhase] = useState("idle");
  const [sonicShuffleTick, setSonicShuffleTick] = useState(0);

  const activeCategory = useMemo(() => {
    if (location.pathname.startsWith("/films")) return "Short Film";
    if (location.pathname.startsWith("/commercial")) return "Commercial";
    if (location.pathname.startsWith("/music-videos")) return "Music Video";
    if (location.pathname.startsWith("/advertising")) return "Advertising";
    if (location.pathname.startsWith("/audiovisual")) return "Audiovisual";
    return initialCategory;
  }, [initialCategory, location.pathname]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === "All") return projects;
    if (activeCategory === "Commercial" || activeCategory === "Advertising") {
      return projects.filter(
        (project) => project.category === "Commercial" || project.type === "commercial"
      );
    }
    if (activeCategory === "Short Film") {
      return projects.filter(
        (project) => project.category === "Short Film" || project.type === "short-film"
      );
    }
    if (activeCategory === "Music Video") {
      return projects.filter(
        (project) => project.category === "Music Video" || project.type === "music-video"
      );
    }
    if (activeCategory === "Audiovisual") {
      return projects.filter(
        (project) => project.category === "Audiovisual" || project.type === "short-film"
      );
    }
    return projects.filter((project) => project.category === activeCategory);
  }, [activeCategory]);

  const currentPool = filteredProjects.length > 0 ? filteredProjects : projects;

  useEffect(() => {
    if (displayedProjects.length === 0) {
      setDisplayedProjects(currentPool);
      return undefined;
    }

    const currentIds = displayedProjects.map((project) => project.id).join("|");
    const nextIds = currentPool.map((project) => project.id).join("|");

    if (currentIds === nextIds) return undefined;

    let fadeInTimer = 0;
    setFilterPhase("out");

    const swapTimer = window.setTimeout(() => {
      setDisplayedProjects(currentPool);
      setFilterPhase("in");

      fadeInTimer = window.setTimeout(() => {
        setFilterPhase("idle");
      }, 500);
    }, 300);

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(fadeInTimer);
    };
  }, [currentPool, displayedProjects]);

  const getProjectById = useCallback(
    (id) => projects.find((project) => project.id === id) ?? null,
    []
  );

  const activeProject = useMemo(() => {
    if (!projectId) return null;
    return getProjectById(projectId) ?? null;
  }, [projectId]);

  const basePath = useMemo(() => {
    if (location.pathname.startsWith("/project/")) return "/";
    if (location.pathname.startsWith("/films")) return "/films";
    if (location.pathname.startsWith("/commercial")) return "/commercial";
    if (location.pathname.startsWith("/music-videos")) return "/music-videos";
    if (location.pathname.startsWith("/advertising")) return "/advertising";
    if (location.pathname.startsWith("/audiovisual")) return "/audiovisual";
    return "/work";
  }, [location.pathname]);

  const finalizeProjectOpen = useCallback(
    (id) => {
      if (location.pathname === "/" || location.pathname.startsWith("/project/")) {
        navigate(`/project/${id}`);
        return;
      }

      navigate(`${basePath}/${id}`);
    },
    [basePath, location.pathname, navigate]
  );

  const openProject = useCallback(
    (id, rect) => {
      if (rect) {
        const project = getProjectById(id);
        if (project) {
          setTransitionState({ project, rect, targetId: id });
          finalizeProjectOpen(id);
          return;
        }
      }

      finalizeProjectOpen(id);
    },
    [finalizeProjectOpen]
  );

  const closeProject = useCallback(() => {
    navigate(basePath === "/" ? "/work" : basePath);
  }, [basePath, navigate]);

  const goToOffset = useCallback(
    (offset) => {
      if (!activeProject) return;

      const currentIndex = Math.max(
        0,
        currentPool.findIndex((project) => project.id === activeProject.id)
      );
      const nextIndex = (currentIndex + offset + currentPool.length) % currentPool.length;
      openProject(currentPool[nextIndex].id);
    },
    [activeProject, currentPool, openProject]
  );

  useEffect(() => {
    if (projectId) {
      setShowIntroOverlay(false);
    }
  }, [projectId]);

  const triggerSonicShuffle = useCallback(() => {
    setSonicShuffleTick((value) => value + 1);
  }, []);

  return (
    <>
      <EpicIntro enabled={showIntroOverlay} onComplete={() => setShowIntroOverlay(false)} />

      <main className={`portfolio-page ${showIntroOverlay ? "is-obscured" : ""}`}>
        <section className={`portfolio-stage ${transitionState ? "is-transitioning" : ""}`}>
          <MinimalMenu onSonicShuffle={triggerSonicShuffle} />
          <p className="portfolio-tagline">where sound meets meaning.</p>
          <div className="portfolio-views">
            <div className="portfolio-view portfolio-view-carousel is-active">
              <div
                className={`portfolio-wheel-shell ${
                  filterPhase === "out"
                    ? "is-filtering-out"
                    : filterPhase === "in"
                      ? "is-filtering-in"
                      : ""
                }`}
              >
                <AudioKeys />
                <VideoWheel
                  projects={displayedProjects}
                  onProjectSelect={openProject}
                  launchingProjectId={transitionState?.targetId ?? null}
                  isReady={!showIntroOverlay}
                  sonicShuffleTick={sonicShuffleTick}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {transitionState ? (
        <VideoTransitionLayer
          project={transitionState.project}
          originRect={transitionState.rect}
          onComplete={() => setTransitionState(null)}
        />
      ) : null}

      {activeProject ? (
        <ImmersivePlayer
          project={activeProject}
          onClose={closeProject}
          onPrev={() => goToOffset(-1)}
          onNext={() => goToOffset(1)}
        />
      ) : null}
    </>
  );
}
