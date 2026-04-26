import React from 'react'
import ProjectCard from "./ProjectCard";

const layoutPattern = ["feature", "portrait", "video", "standard", "landscape", "portrait"];

export default function WorkGrid({ projects, offset = 0 }) {
  return (
    <div className="work-grid">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.slug}
          project={project}
          index={index + offset}
          variant={layoutPattern[index % layoutPattern.length]}
        />
      ))}
    </div>
  );
}
