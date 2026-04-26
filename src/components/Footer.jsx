import React from 'react'
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-name">Nico Svetliza</p>
          <p className="footer-line">Advertising / Audiovisual / Sound / Brand Systems</p>
        </div>

        <div className="footer-links">
          <Link to="/work">Work</Link>
          <Link to="/brands">Brands</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
