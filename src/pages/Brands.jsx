import React from 'react'
import BrandLogoStrip from "../components/BrandLogoStrip";
import CTA from "../components/CTA";
import { brands, projects } from "../data/projects";

export default function Brands() {
  return (
    <>
      <section className="page-hero section">
        <div className="container page-shell">
          <div className="archive-page-intro">
            <p className="section-label">Brands</p>
            <h1>Clients, identities and recurring systems.</h1>
            <p>A compact archive of brands, collaborations and visual territories.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container page-shell brand-archive-main">
          <BrandLogoStrip brands={brands} />
          <div className="brand-showcase">
            {projects.map((project, index) => (
              <article key={project.slug} className="brand-showcase-card">
                <div className="brand-showcase-index">{String(index + 1).padStart(2, "0")}</div>
                <div className="brand-logo-mark">{project.brandLogo}</div>
                <div>
                  <p className="brand-showcase-name">{project.brand}</p>
                  <p className="brand-showcase-text">{project.shortDescription}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CTA title="Need a more coherent brand system?" text="Identity fragments, campaigns and motion can be organized into one precise visual language." />
    </>
  );
}
