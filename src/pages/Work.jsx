import React from 'react'
import { useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import WorkGrid from "../components/WorkGrid";
import CTA from "../components/CTA";
import { filters, projects } from "../data/projects";

export default function Work() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredProjects = useMemo(() => {
    if (activeFilter === "All") return projects;
    if (activeFilter === "Ads") {
      return projects.filter((project) => project.group === "Advertising");
    }
    if (activeFilter === "Short Film") {
      return projects.filter((project) => project.group === "Audiovisual");
    }
    return projects;
  }, [activeFilter]);

  return (
    <>
      <section className="page-hero section">
        <div className="container page-shell">
          <div className="archive-page-intro">
            <p className="section-label">Work</p>
            <h1>Archive of campaigns, motion and brand systems.</h1>
            <p>Browse the collection by category.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container page-shell">
          <FilterBar options={filters} activeFilter={activeFilter} onChange={setActiveFilter} />
          <WorkGrid projects={filteredProjects} />
        </div>
      </section>

      <CTA title="Need a precise visual archive?" text="Advertising, audiovisual work and brand systems built with clear structure and premium restraint." />
    </>
  );
}
