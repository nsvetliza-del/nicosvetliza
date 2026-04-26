import React, { useRef, useState } from "react";
import { NavLink } from "react-router-dom";

const BRAND_NAME = "Nico Svetliza™";

const links = [
  { label: "About", to: "/about" },
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

  const tuningTimerRef = useRef(null);

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

    if (window.innerWidth > 768) {
      onSonicShuffle?.();
    }
  };

  return (
    <>
      <nav className="minimal-menu" aria-label="Main navigation">
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
        className={`minimal-menu-pulse ${isTuning ? "is-tuning" : ""}`}
        onClick={handleTune}
        aria-label="Tune orchestra"
        title="tune"
      />
    </>
  );
}
