import React from 'react'
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  { label: "Portfolio", to: "/work" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="site-header">
      <div className="container navbar">
        <Link className="brand-mark" to="/" onClick={closeMenu} aria-label="Nico Svetliza home">
          <span className="brand-name">Nico Svetliza</span>
        </Link>

        <nav className="nav-links-desktop" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          className={`menu-button ${isOpen ? "is-open" : ""}`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <strong className="menu-button-label">{isOpen ? "Close" : "Menu"}</strong>
          <span className="menu-button-bar" />
          <span className="menu-button-bar" />
        </button>

        <nav className={`nav-links ${isOpen ? "is-open" : ""}`} aria-label="Mobile menu">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}
              to={item.to}
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
