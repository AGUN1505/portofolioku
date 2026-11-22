'use client';

import { useState } from "react";
import { SectionHeaderStrip } from "./SectionHeaderStrip";
import { ScrollReveal } from "./ScrollReveal";
import type { ProjectViewModel } from "../../view-models";

interface ProjectsSectionProps {
  readonly projects: ReadonlyArray<ProjectViewModel>;
  readonly sectionIndex?: string;
  readonly sectionCounter?: string;
  readonly initialLimit?: number;
}

export function ProjectsSection({
  projects,
  sectionIndex = "03",
  sectionCounter = "SECTION 03 / 06",
  initialLimit,
}: ProjectsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  // If initialLimit is explicitly passed, use it. Otherwise, default to 3 if more than 3 projects, or 2 if exactly 3 projects.
  const limit = initialLimit ?? (projects.length > 3 ? 3 : 2);
  const hasMoreProjects = projects.length > limit;
  const visibleProjects = showAll ? projects : projects.slice(0, limit);

  const handleToggle = () => {
    if (showAll) {
      setShowAll(false);
      const section = document.getElementById("projects");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      setShowAll(true);
    }
  };

  return (
    <section
      id="projects"
      aria-label="Featured Projects"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      <SectionHeaderStrip
        indexLabel={`[ ${sectionIndex} // SELECTED PROJECTS ]`}
        subtitle="PORTFOLIO SHOWCASE — MOBILE, WEB & API SYSTEMS"
        counter={sectionCounter}
      />

      {/* DESKTOP PROJECTS (1280px+, centered max-w 1440px) */}
      <div className="hidden xl:block mx-auto w-full max-w-[1440px] xl:px-[48px] 2xl:px-[80px] pt-[56px] pb-[80px]">
        <div className="space-y-[64px]">
          {visibleProjects.map((project, index) => (
            <ScrollReveal
              key={project.id}
              delay={index * 120}
              className="group/card border-b border-border-subtle pb-[64px] last:border-b-0 last:pb-0"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(420px,520px)] 2xl:grid-cols-[minmax(0,680px)_600px] items-start gap-[32px] 2xl:gap-[40px]">
                <div className="min-w-0 w-full">
                  <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-text-secondary group-hover/card:text-accent-cobalt transition-colors duration-200">
                    {project.desktopCategory}
                  </p>
                  <h3 className={`mt-[16px] font-sans ${project.desktopTitleSize} font-bold tracking-[-0.01em] text-text-primary group-hover/card:text-accent-cobalt transition-colors duration-200 break-words`}>
                    {project.title}
                  </h3>
                  <p className="mt-[16px] font-sans text-[16px] leading-[26px] font-normal text-text-secondary">
                    {project.description}
                  </p>
                  <div className="mt-[24px] flex flex-wrap gap-[8px]">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex min-h-[28px] ${tag.widthClass} w-auto min-w-fit items-center justify-center border px-[12px] py-[4px] font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] hover:border-accent-cobalt hover:text-accent-cobalt transition-colors duration-200 cursor-default ${
                          tag.accent
                            ? "border-accent-cobalt text-accent-cobalt bg-accent-cobalt/5"
                            : "border-border-subtle text-text-secondary hover:bg-white"
                        }`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 w-full border border-border-subtle group-hover/card:border-accent-cobalt group-hover/card:shadow-md transition-all duration-300 overflow-hidden">
                  <div className="flex min-h-[32px] items-center border-b border-border-subtle px-[12px] py-[6px] bg-bg-surface group-hover/card:bg-white transition-colors duration-300">
                    <span className="min-w-0 truncate font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-text-secondary group-hover/card:text-accent-cobalt transition-colors duration-200">
                      {project.previewHeaderLeft}
                    </span>
                  </div>
                  <div className="flex min-h-[220px] aspect-[16/7] items-center justify-center bg-bg-primary overflow-hidden">
                    {project.thumbnailUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
                      />
                    ) : (
                      <div className="min-w-0 text-center px-[28px] 2xl:px-[40px] py-[32px] 2xl:py-[48px] group-hover/card:scale-102 transition-transform duration-300">
                        <p className="font-sans text-[14px] leading-[17px] font-semibold text-text-primary break-words">
                          {project.previewSpecTitle}
                        </p>
                        <p className="mt-[8px] font-mono text-[10px] leading-[14px] font-normal text-text-secondary break-words">
                          {project.previewSpecSub}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {hasMoreProjects && (
          <div className="mt-[64px] flex justify-center">
            <button
              type="button"
              onClick={handleToggle}
              className="group inline-flex items-center gap-[12px] border border-border-subtle bg-bg-surface px-[32px] py-[16px] font-mono text-[11px] leading-[14px] font-semibold tracking-[0.05em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt hover:bg-white active:scale-98 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
            >
              <span className="inline-block transition-transform duration-200 group-hover:scale-110">
                {showAll ? "−" : "+"}
              </span>
              <span>
                {showAll
                  ? "[ SHOW LESS PROJECTS // COLLAPSE ]"
                  : `[ MORE PROJECTS // VIEW ALL (${projects.length}) ]`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* TABLET PROJECTS (768px - 1279px) */}
      <div className="hidden md:block xl:hidden mx-auto w-full max-w-[1440px] px-[40px] pt-[40px] pb-[48px]">
        <div className="space-y-[48px]">
          {visibleProjects.map((project) => (
            <div key={project.id} className="border-b border-border-subtle pb-[48px] last:border-b-0 last:pb-0">
              <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.03em] text-text-secondary">
                {project.tabletTag}
              </p>
              <h3 className={`mt-[14px] font-sans ${project.desktopTitleSize} font-bold tracking-[-0.01em] text-text-primary break-words`}>
                {project.title}
              </h3>
              <p className="mt-[14px] font-sans text-[15px] leading-[24px] font-normal text-text-secondary">
                {project.description}
              </p>

              <div className="mt-[28px] border border-border-subtle">
                <div className="flex min-h-[28px] items-center border-b border-border-subtle px-[12px] py-[6px]">
                  <span className="min-w-0 truncate font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.02em] text-text-secondary">
                    {project.previewHeaderLeft}
                  </span>
                </div>
                <div className="flex aspect-[16/7] items-center justify-center bg-bg-primary overflow-hidden">
                  {project.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="min-w-0 text-center px-[32px] py-[40px]">
                      <p className="font-sans text-[13px] leading-[16px] font-semibold text-text-primary break-words">
                        {project.title}
                      </p>
                      <p className="mt-[6px] font-mono text-[9px] leading-[13px] font-normal text-text-secondary break-words">
                        {project.tabletPreviewLine2}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-[20px] flex flex-wrap gap-[8px]">
                {project.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex min-h-[26px] ${tag.widthClass} w-auto min-w-fit items-center justify-center border px-[10px] py-[4px] font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] ${
                      tag.accent
                        ? "border-accent-cobalt text-accent-cobalt"
                        : "border-border-subtle text-text-secondary"
                    }`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {hasMoreProjects && (
          <div className="mt-[40px] flex justify-center">
            <button
              type="button"
              onClick={handleToggle}
              className="group inline-flex items-center gap-[10px] border border-border-subtle bg-bg-surface px-[24px] py-[14px] font-mono text-[10px] leading-[13px] font-semibold tracking-[0.04em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt hover:bg-white active:scale-98 transition-all duration-200 cursor-pointer"
            >
              <span className="inline-block transition-transform duration-200 group-hover:scale-110">
                {showAll ? "−" : "+"}
              </span>
              <span>
                {showAll
                  ? "[ SHOW LESS // COLLAPSE ]"
                  : `[ MORE PROJECTS // VIEW ALL (${projects.length}) ]`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* MOBILE PROJECTS (< 768px) */}
      <div className="md:hidden px-[16px] sm:px-[24px] pt-[28px] pb-[40px]">
        <div className="space-y-[40px]">
          {visibleProjects.map((project) => (
            <div key={project.id} className="border-b border-border-subtle pb-[40px] last:border-b-0 last:pb-0">
              <p className="font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.03em] text-text-secondary">
                {project.mobileTag}
              </p>
              <h3 className={`mt-[12px] font-sans ${project.mobileTitleSize} font-bold tracking-[-0.01em] text-text-primary break-words`}>
                {project.title}
              </h3>
              <p className="mt-[12px] font-sans text-[14px] leading-[22px] font-normal text-text-secondary">
                {project.mobileDescription}
              </p>

              <div className="mt-[24px] border border-border-subtle">
                <div className="flex min-h-[24px] items-center border-b border-border-subtle px-[12px] py-[5px]">
                  <span className="min-w-0 truncate font-mono text-[8px] leading-[10px] font-semibold tracking-[0.02em] text-text-secondary">
                    PREVIEW // {project.id}
                  </span>
                </div>
                <div className="flex min-h-[140px] aspect-[16/7] items-center justify-center bg-bg-primary overflow-hidden">
                  {project.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="min-w-0 text-center px-[16px] sm:px-[24px] py-[28px]">
                      <p className="font-sans text-[12px] leading-[15px] font-semibold text-text-primary break-words">
                        {project.title}
                      </p>
                      <p className="mt-[6px] font-mono text-[8.5px] leading-[12px] font-normal text-text-secondary break-words">
                        {project.mobilePreviewLine2}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-[16px] flex flex-wrap gap-[6px]">
                {project.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex min-h-[24px] px-[10px] py-[4px] items-center justify-center border font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.02em] ${
                      tag.accent
                        ? "border-accent-cobalt text-accent-cobalt"
                        : "border-border-subtle text-text-secondary"
                    }`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {hasMoreProjects && (
          <div className="mt-[32px] flex justify-center">
            <button
              type="button"
              onClick={handleToggle}
              className="w-full group inline-flex items-center justify-center gap-[8px] border border-border-subtle bg-bg-surface px-[18px] py-[12px] font-mono text-[9.5px] leading-[12px] font-semibold tracking-[0.03em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt hover:bg-white active:scale-98 transition-all duration-200 cursor-pointer"
            >
              <span className="inline-block transition-transform duration-200 group-hover:scale-110">
                {showAll ? "−" : "+"}
              </span>
              <span>
                {showAll
                  ? "[ SHOW LESS // COLLAPSE ]"
                  : `[ MORE PROJECTS (${projects.length}) ]`}
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
