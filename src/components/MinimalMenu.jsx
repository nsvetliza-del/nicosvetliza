import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import blueDotSound from "../assets/audios/blue-dot-sound.mp3";

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
  const tuningTimerRef = useRef(0);
  const blueDotAudioRef = useRef(null);

  const playBlueSound = () => {
    const audio = blueDotAudioRef.current;
    if (!audio) return;

    console.log("blue dot sound play called");
    audio.pause();
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("blue dot sound error", error);
      });
    }
  };

  const handleTune = () => {
    console.log("blue dot clicked");
    setIsTuning(true);
    window.clearTimeout(tuningTimerRef.current);
    tuningTimerRef.current = window.setTimeout(() => setIsTuning(false), 1080);
    playBlueSound();
    onSonicShuffle?.();
  };

  useEffect(() => {
    const audio = new Audio(blueDotSound);
    audio.preload = "auto";
    audio.volume = 0.7;
    audio.loop = false;
    audio.load();
    blueDotAudioRef.current = audio;

    return () => {
      window.clearTimeout(tuningTimerRef.current);
      audio.pause();
      audio.currentTime = 0;
      if (blueDotAudioRef.current === audio) {
        blueDotAudioRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <nav className="minimal-menu" aria-label="Main navigation">
        <NavLink to="/work" className="minimal-menu-brand">
          {BRAND_NAME}
        </NavLink>

        <div
          className={`minimal-menu-portfolio-group ${isPortfolioOpen ? "is-open" : ""}`}
          onMouseEnter={() => setIsPortfolioOpen(true)}
          onMouseLeave={() => setIsPortfolioOpen(false)}
        >
          <NavLink
            to="/work"
            className={({ isActive }) =>
              `minimal-menu-link ${isActive ? "is-active" : ""}`
            }
            onClick={() => setIsPortfolioOpen((open) => !open)}
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
            className={({ isActive }) => `minimal-menu-link ${isActive ? "is-active" : ""}`}
          >
            {link.label}
          </NavLink>
        ))}
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
