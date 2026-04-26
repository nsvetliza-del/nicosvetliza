import React from "react";
import { NavLink } from "react-router-dom";

// Change the name shown in the center nav here.
const BRAND_NAME = "Nico Svetliza™";

const links = [
  { label: "Works", to: "/work" },
  { label: "Advertising", to: "/advertising" },
  { label: "Audiovisual", to: "/audiovisual" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function MinimalNav() {
  return (
    <nav className="minimal-nav" aria-label="Main navigation">
      <span className="minimal-nav-brand">{BRAND_NAME}</span>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => `minimal-nav-link ${isActive ? "is-active" : ""}`}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
