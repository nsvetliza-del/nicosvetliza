import React from 'react'
import { Link } from "react-router-dom";

export default function CTA({
  title = "Need a curated visual system?",
  text = "Campaigns, motion and brand assets built with structure, clarity and visual control.",
}) {
  return (
    <section className="archive-cta">
      <div className="container">
        <div className="cta-card">
          <div>
            <p className="section-label">Contact</p>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>

          <div className="cta-actions">
            <Link className="button button-primary" to="/contact">
              Contact Nico
            </Link>
            <Link className="button button-secondary" to="/work">
              Browse Work
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
