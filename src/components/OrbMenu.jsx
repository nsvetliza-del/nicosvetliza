import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { label: "Portfolio", to: "/work", className: "is-portfolio" },
  { label: "About", to: "/about", className: "is-about" },
  { label: "Contact", to: "/contact", className: "is-contact" },
];

export default function OrbMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`orb-menu ${isOpen ? "is-open" : ""}`}>
      <div className="orb-menu-constellation" aria-hidden="true">
        {menuItems.map((item) => (
          <span key={item.to} className={`orb-menu-node ${item.className}`} />
        ))}
      </div>

      <button
        type="button"
        className="orb-menu-trigger"
        aria-expanded={isOpen}
        aria-label="Toggle menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span />
        <span />
      </button>

      <nav className="orb-menu-links" aria-label="Primary navigation">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `orb-menu-link ${item.className} ${isActive ? "is-active" : ""}`}
            onClick={() => setIsOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
