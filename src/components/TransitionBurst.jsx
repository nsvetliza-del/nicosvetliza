import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function TransitionBurst() {
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer = 0;

    setIsActive(false);
    requestAnimationFrame(() => {
      setIsActive(true);
    });

    timer = window.setTimeout(() => {
      setIsActive(false);
    }, 720);

    return () => window.clearTimeout(timer);
  }, [location.key]);

  return (
    <div
      className={`transition-burst ${isActive ? "is-active" : ""}`}
      aria-hidden="true"
    />
  );
}
