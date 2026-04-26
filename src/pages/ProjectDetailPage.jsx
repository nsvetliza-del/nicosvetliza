import React from 'react'
import { Link, useParams } from "react-router-dom";
import ProjectDetail from "../components/ProjectDetail";
import { getProjectBySlug, projects } from "../data/projects";

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const project = getProjectBySlug(slug);
  const projectIndex = projects.findIndex((item) => item.slug === slug);
  const relatedProjects = project
    ? projects
        .filter((item) => item.slug !== project.slug && item.group === project.group)
        .slice(0, 3)
    : [];

  if (!project) {
    return (
      <section className="section">
        <div className="container narrow">
          <p className="section-label">Project not found</p>
          <h1>This project does not exist yet.</h1>
          <p>
            Check the slug in <code>src/data/projects.js</code> or add a new project entry.
          </p>
          <Link className="button button-primary" to="/work">
            Back to Work
          </Link>
        </div>
      </section>
    );
  }

  return (
    <ProjectDetail
      project={project}
      projectIndex={projectIndex}
      relatedProjects={relatedProjects}
    />
  );
}
