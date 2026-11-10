import { SectionHeaderStrip } from "./SectionHeaderStrip";
import type { ProjectViewModel } from "../../view-models";

interface ProjectsSectionProps {
  readonly projects: ReadonlyArray<ProjectViewModel>;
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section
      id="projects"
      aria-label="Featured Projects"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      <SectionHeaderStrip
        indexLabel="[ 03 // SELECTED PROJECTS ]"
        subtitle="PORTFOLIO SHOWCASE — MOBILE, WEB & API SYSTEMS"
        counter="SECTION 03 / 06"
      />

      {/* DESKTOP PROJECTS (1440px) */}
      <div className="hidden xl:block px-[80px] pt-[56px] pb-[80px]">
        <div className="space-y-[64px]">
          {projects.map((project) => (
            <div key={project.id} className="border-b border-border-subtle pb-[64px] last:border-b-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div className="w-[680px]">
                  <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-text-secondary">
                    {project.desktopCategory}
                  </p>
                  <h3 className={`mt-[16px] font-sans ${project.desktopTitleSize} font-bold tracking-[-0.01em] text-text-primary`}>
                    {project.title}
                  </h3>
                  <p className="mt-[16px] font-sans text-[16px] leading-[26px] font-normal text-text-secondary">
                    {project.description}
                  </p>
                  <div className="mt-[24px] flex flex-wrap gap-[8px]">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`flex h-[28px] ${tag.widthClass} items-center justify-center border font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] ${
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

                <div className="w-[600px] border border-border-subtle">
                  <div className="flex h-[32px] items-center border-b border-border-subtle px-[12px]">
                    <span className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-text-secondary">
                      {project.previewHeaderLeft}
                    </span>
                  </div>
                  <div className="flex aspect-[16/7] items-center justify-center bg-bg-primary px-[40px] py-[48px]">
                    <div className="text-center">
                      <p className="font-sans text-[14px] leading-[17px] font-semibold text-text-primary">
                        {project.previewSpecTitle}
                      </p>
                      <p className="mt-[8px] font-mono text-[10px] leading-[12px] font-normal text-text-secondary">
                        {project.previewSpecSub}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLET PROJECTS (768px) */}
      <div className="hidden md:block xl:hidden px-[40px] pt-[40px] pb-[48px]">
        <div className="space-y-[48px]">
          {projects.map((project) => (
            <div key={project.id} className="border-b border-border-subtle pb-[48px] last:border-b-0 last:pb-0">
              <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.03em] text-text-secondary">
                {project.tabletTag}
              </p>
              <h3 className={`mt-[14px] font-sans ${project.desktopTitleSize} font-bold tracking-[-0.01em] text-text-primary`}>
                {project.title}
              </h3>
              <p className="mt-[14px] font-sans text-[15px] leading-[24px] font-normal text-text-secondary">
                {project.description}
              </p>

              <div className="mt-[28px] border border-border-subtle">
                <div className="flex h-[28px] items-center border-b border-border-subtle px-[12px]">
                  <span className="font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.02em] text-text-secondary">
                    {project.previewHeaderLeft}
                  </span>
                </div>
                <div className="flex aspect-[16/7] items-center justify-center bg-bg-primary px-[32px] py-[40px]">
                  <div className="text-center">
                    <p className="font-sans text-[13px] leading-[16px] font-semibold text-text-primary">
                      {project.title}
                    </p>
                    <p className="mt-[6px] font-mono text-[9px] leading-[11px] font-normal text-text-secondary">
                      {project.tabletPreviewLine2}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-[20px] flex flex-wrap gap-[8px]">
                {project.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`flex h-[26px] ${tag.widthClass} items-center justify-center border font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] ${
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
      </div>

      {/* MOBILE PROJECTS (390px) */}
      <div className="md:hidden px-[24px] pt-[28px] pb-[40px]">
        <div className="space-y-[40px]">
          {projects.map((project) => (
            <div key={project.id} className="border-b border-border-subtle pb-[40px] last:border-b-0 last:pb-0">
              <p className="font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.03em] text-text-secondary">
                {project.mobileTag}
              </p>
              <h3 className={`mt-[12px] font-sans ${project.mobileTitleSize} font-bold tracking-[-0.01em] text-text-primary`}>
                {project.title}
              </h3>
              <p className="mt-[12px] font-sans text-[14px] leading-[22px] font-normal text-text-secondary">
                {project.mobileDescription}
              </p>

              <div className="mt-[24px] border border-border-subtle">
                <div className="flex h-[24px] items-center border-b border-border-subtle px-[12px]">
                  <span className="font-mono text-[8px] leading-[10px] font-semibold tracking-[0.02em] text-text-secondary">
                    PREVIEW // {project.id}
                  </span>
                </div>
                <div className="flex aspect-[16/7] items-center justify-center bg-bg-primary px-[24px] py-[32px]">
                  <div className="text-center">
                    <p className="font-sans text-[12px] leading-[14px] font-semibold text-text-primary">
                      {project.title}
                    </p>
                    <p className="mt-[6px] font-mono text-[8.5px] leading-[10px] font-normal text-text-secondary">
                      {project.mobilePreviewLine2}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-[16px] flex flex-wrap gap-[6px]">
                {project.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`flex h-[24px] px-[10px] items-center justify-center border font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.02em] ${
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
      </div>
    </section>
  );
}
