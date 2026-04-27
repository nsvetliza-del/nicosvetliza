import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const TRANSITION_DURATION = 700;

export default function PageTransition({ children }) {
  const location = useLocation();
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    let activeTimer = 0;
    let doneTimer = 0;

    document.body.classList.add("is-transitioning");
    setPhase("enter");

    activeTimer = window.setTimeout(() => {
      setPhase("enter-active");
    }, 20);

    doneTimer = window.setTimeout(() => {
      document.body.classList.remove("is-transitioning");
    }, TRANSITION_DURATION);

    return () => {
      window.clearTimeout(activeTimer);
      window.clearTimeout(doneTimer);
      document.body.classList.remove("is-transitioning");
    };
  }, [location.key]);

  return (
    <div className={`page-transition page-transition-${phase}`} key={location.key}>
      {children}
    </div>
  );
}
