import React from 'react'
import { NavLink } from "react-router-dom";

const archiveItems = [
  { number: "01", label: "Work", to: "/work" },
  { number: "02", label: "Advertising", to: "/advertising" },
  { number: "03", label: "Audiovisual", to: "/audiovisual" },
  { number: "04", label: "Brands", to: "/brands" },
  { number: "05", label: "Contact", to: "/contact" },
];

export default function ArchiveSidebar() {
  return (
    <aside className="archive-sidebar" aria-label="Archive sections">
      <div className="archive-sidebar-inner">
        {archiveItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `archive-sidebar-link ${isActive ? "is-active" : ""}`}
          >
            <span>{item.number}</span>
            <strong>{item.label}</strong>
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
