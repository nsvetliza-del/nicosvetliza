import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import blueDotSound from "../assets/audios/blue-dot-sound.mp3";

const BRAND_NAME = "Nico Svetliza™";

const links = [
  { label: "About", to: "/about" },
  { label: "Equipment", to: "/equipment" },
  { label: "Contact", to: "/contact" },
];

const portfolioLinks = [
  { label: "Films", to: "/films" },
  { label: "Commercials & Fashion Films", to: "/commercial" },
  { label: "Music Videos", to: "/music-videos" },
];

export default function MinimalMenu({ onSonicShuffle }) {
  const [isTuning, setIsTuning] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isHiddenOnScroll, setIsHiddenOnScroll] = useState(false);

  const tuningTimerRef = useRef(null);
  const navRef = useRef(null);
  const location = useLocation();

  // Mobile header (all pages): hides when scrolling down past 24px, returns on any
  // upward scroll (8px tolerance) or at the top. Its measured bottom edge is exposed as
  // --mobile-header-bottom so page content can start below it.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(max-width: 768px)");
    const root = document.documentElement;
    const HIDE_AFTER = 24;
    const TOLERANCE = 8;

    const getScrollTop = () =>
      Math.max(window.scrollY, root.scrollTop, document.body.scrollTop);

    let hidden = false;
    let lastY = getScrollTop();
    let frame = 0;

    const setHidden = (value) => {
      if (value === hidden) return;
      hidden = value;
      setIsHiddenOnScroll(value);
      document.body.classList.toggle("mobile-menu-hidden", value);
    };

    const update = () => {
      frame = 0;
      const y = getScrollTop();
      if (!media.matches || y <= HIDE_AFTER) {
        setHidden(false);
        lastY = y;
        return;
      }
      if (y - lastY > TOLERANCE) {
        setHidden(true);
        lastY = y;
      } else if (lastY - y > TOLERANCE) {
        setHidden(false);
        lastY = y;
      }
    };

    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const measure = () => {
      const nav = navRef.current;
      if (!media.matches || !nav || hidden) return;
      root.style.setProperty("--mobile-header-bottom", `${Math.ceil(nav.getBoundingClientRect().bottom)}px`);
    };

    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (navRef.current) observer?.observe(navRef.current);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", measure);
    media.addEventListener("change", update);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measure);
      media.removeEventListener("change", update);
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      document.body.classList.remove("mobile-menu-hidden");
    };
  }, [location.pathname]);

  const playBlueSound = async () => {
    try {
      const audio = new Audio(blueDotSound);

      audio.volume = 0.9;
      audio.currentTime = 0;
      audio.muted = false;

      await audio.play();
    } catch (error) {
      console.warn("blue dot sound error", error);
    }
  };

  const handleTune = () => {
    playBlueSound();

    setIsTuning(true);
    window.clearTimeout(tuningTimerRef.current);
    tuningTimerRef.current = window.setTimeout(() => {
      setIsTuning(false);
    }, 1080);

    onSonicShuffle?.();
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`minimal-menu ${
          isHiddenOnScroll ? "is-hidden-on-scroll mobile-menu-hidden" : ""
        }`}
        aria-label="Main navigation"
        aria-hidden={isHiddenOnScroll ? true : undefined}
      >
        <NavLink to="/work" className="minimal-menu-brand">
          {BRAND_NAME}
        </NavLink>

        <div className="minimal-menu-links-row">
          <NavLink
            to="/selected-work"
            className={({ isActive }) =>
              `minimal-menu-link ${isActive ? "is-active" : ""}`
            }
          >
            Selected Work
          </NavLink>

          <div
            className={`minimal-menu-portfolio-group ${
              isPortfolioOpen ? "is-open" : ""
            }`}
            onMouseEnter={() => setIsPortfolioOpen(true)}
            onMouseLeave={() => setIsPortfolioOpen(false)}
          >
            <NavLink
              to="/work"
              className={({ isActive }) =>
                `minimal-menu-link ${isActive ? "is-active" : ""}`
              }
              onClick={(event) => {
                if (window.innerWidth <= 768) {
                  event.preventDefault();
                }

                setIsPortfolioOpen((open) => !open);
              }}
              onFocus={() => setIsPortfolioOpen(true)}
            >
              Portfolio
            </NavLink>

            <div className="minimal-menu-submenu">
              {portfolioLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `minimal-menu-sublink ${isActive ? "is-active" : ""}`
                  }
                  onClick={() => setIsPortfolioOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `minimal-menu-link ${isActive ? "is-active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <button
        type="button"
        className={`minimal-menu-pulse ${isTuning ? "is-tuning" : ""} ${
          isHiddenOnScroll ? "mobile-menu-hidden" : ""
        }`}
        onClick={handleTune}
        aria-label="Tune orchestra"
        title="tune"
      />
    </>
  );
}
