import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

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
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const isMobileAboutOrContact =
      window.matchMedia("(max-width: 768px)").matches &&
      (location.pathname === "/about" || location.pathname === "/contact");

    if (!isMobileAboutOrContact) {
      setIsHiddenOnScroll(false);
      document.body.classList.remove("mobile-menu-hidden");
      return undefined;
    }

    const getScrollTop = () =>
      Math.max(
        window.scrollY,
        document.documentElement.scrollTop,
        document.body.scrollTop
      );

    const handleScroll = () => {
      const shouldHide = getScrollTop() > 8;

      setIsHiddenOnScroll(shouldHide);
      document.body.classList.toggle("mobile-menu-hidden", shouldHide);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.classList.remove("mobile-menu-hidden");
    };
  }, [location.pathname]);

  const playBlueSound = async () => {
    try {
      console.log("blue dot clicked");

      const audio = new Audio(
        "https://res.cloudinary.com/dlpmcvfva/video/upload/v1777178050/blue-dot-sound_kycbix.wav"
      );

      audio.volume = 0.9;
      audio.currentTime = 0;
      audio.muted = false;

      await audio.play();

      console.log("blue dot sound started");
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
        className={`minimal-menu ${
          isHiddenOnScroll ? "is-hidden-on-scroll mobile-menu-hidden" : ""
        }`}
        aria-label="Main navigation"
      >
        <NavLink to="/work" className="minimal-menu-brand">
          {BRAND_NAME}
        </NavLink>

        <div className="minimal-menu-links-row">
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
