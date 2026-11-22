import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { CompositionRoot } from "@/src/infrastructure/composition-root";
import { PortfolioViewMapper } from "@/src/presentation/mappers/portfolio-view-mapper";
import { Footer } from "@/src/presentation/components/portfolio/Footer";
import { ScrollReveal } from "@/src/presentation/components/portfolio/ScrollReveal";

export const instant = false;

export const metadata: Metadata = {
  title: "All Projects — Agun Firmansyah",
  description:
    "Explore the complete portfolio of software engineering projects, mobile systems, and backend architectures built by Agun Firmansyah.",
};

export default async function ProjectsIndexPage() {
  await connection();
  const portfolio = await CompositionRoot.getResilientPortfolioUseCase().execute();
  const projects = portfolio.projects.map(PortfolioViewMapper.toProjectViewModel);
  const brandName = portfolio.hero.name || "AGUN FIRMANSYAH";

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between px-[16px] sm:px-[32px] lg:px-[64px]">
          <Link
            href="/"
            className="flex items-center gap-[10px] group transition-opacity hover:opacity-80"
          >
            <span
              aria-hidden="true"
              className="h-[10px] w-[10px] shrink-0 bg-accent-cobalt transition-transform duration-200 group-hover:scale-125"
            />
            <span className="font-sans text-[14px] sm:text-[15px] font-bold tracking-[0.02em] text-text-primary">
              {brandName}
            </span>
          </Link>

          <Link
            href="/#projects"
            className="group inline-flex items-center gap-[8px] border border-border-subtle bg-bg-primary px-[14px] sm:px-[18px] py-[8px] font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.04em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt transition-colors duration-200"
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>
            <span>[ BACK TO HOME ]</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto max-w-[1440px] px-[16px] sm:px-[32px] lg:px-[64px] py-[40px] sm:py-[64px] 2xl:py-[80px]">
        {/* Breadcrumb Strip */}
        <div className="flex items-center gap-[8px] font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.05em] text-text-secondary">
          <Link href="/" className="hover:text-accent-cobalt transition-colors">
            PORTFOLIO
          </Link>
          <span>//</span>
          <span className="text-accent-cobalt uppercase">ALL PROJECTS</span>
        </div>

        {/* Header Strip */}
        <div className="mt-[24px] sm:mt-[32px] border-b border-border-subtle pb-[32px] sm:pb-[48px]">
          <p className="font-mono text-[11px] sm:text-[12px] font-semibold tracking-[0.06em] text-accent-cobalt">
            [ ARCHIVE // COMPLETE PORTFOLIO SHOWCASE ]
          </p>
          <div className="mt-[16px] flex flex-col md:flex-row md:items-end md:justify-between gap-[16px]">
            <div>
              <h1 className="font-sans text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.1] font-bold tracking-[-0.02em] text-text-primary">
                All Projects
              </h1>
              <p className="mt-[16px] max-w-[720px] font-sans text-[15px] sm:text-[17px] leading-[26px] text-text-secondary">
                Daftar lengkap proyek rekayasa perangkat lunak, sistem backend terdistribusi, aplikasi mobile, dan solusi digital yang telah dikembangkan.
              </p>
            </div>
            <div className="shrink-0 font-mono text-[11px] sm:text-[12px] text-text-secondary border border-border-subtle bg-bg-surface px-[16px] py-[10px]">
              TOTAL SHOWCASED: <span className="font-bold text-accent-cobalt">{projects.length}</span> PROJECTS
            </div>
          </div>
        </div>

        {/* 3-Column Card Grid */}
        <div className="mt-[48px] sm:mt-[64px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px] xl:gap-[32px]">
          {projects.map((project, index) => (
            <ScrollReveal
              key={project.id}
              delay={index * 70}
              className="h-full"
            >
              <article className="group/card h-full flex flex-col border border-border-subtle bg-bg-surface hover:border-accent-cobalt hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Project Mockup / Thumbnail Box */}
                <Link
                  href={`/projects/${project.id}`}
                  className="block relative w-full aspect-[16/10] bg-bg-primary border-b border-border-subtle overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 left-0 right-0 z-10 flex min-h-[28px] items-center justify-between border-b border-border-subtle/80 bg-bg-surface/90 backdrop-blur-xs px-[12px] py-[4px]">
                    <span className="font-mono text-[9px] font-semibold tracking-[0.02em] text-text-secondary group-hover/card:text-accent-cobalt transition-colors duration-200">
                      PRJ // 0{index + 1}
                    </span>
                    <span className="h-[6px] w-[6px] rounded-full bg-accent-cobalt" />
                  </div>

                  <div className="h-full w-full pt-[28px] flex items-center justify-center overflow-hidden">
                    {project.thumbnailUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
                      />
                    ) : (
                      <div className="p-[24px] text-center">
                        <div className="mx-auto flex h-[40px] w-[40px] items-center justify-center border border-border-subtle bg-bg-surface text-accent-cobalt font-mono text-[12px] font-semibold">
                          0{index + 1}
                        </div>
                        <p className="mt-[12px] font-sans text-[13px] font-semibold text-text-primary line-clamp-1">
                          {project.title}
                        </p>
                        <p className="mt-[4px] font-mono text-[9px] text-text-secondary">
                          Specification Spec Area
                        </p>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Card Content */}
                <div className="p-[20px] sm:p-[24px] flex-1 flex flex-col">
                  <p className="font-mono text-[9.5px] leading-[12px] font-semibold tracking-[0.04em] text-accent-cobalt">
                    // {project.category.toUpperCase()}
                  </p>

                  <h3 className="mt-[10px] font-sans text-[19px] sm:text-[21px] font-bold text-text-primary tracking-[-0.01em] group-hover/card:text-accent-cobalt transition-colors duration-200 line-clamp-1">
                    <Link href={`/projects/${project.id}`}>
                      {project.title}
                    </Link>
                  </h3>

                  <p className="mt-[12px] font-sans text-[14px] leading-[22px] text-text-secondary flex-1 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Technology Tags */}
                  <div className="mt-[20px] flex flex-wrap gap-[6px]">
                    {project.technologies.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-[8px] py-[3px] border border-border-subtle bg-bg-primary font-mono text-[9px] font-semibold text-text-secondary group-hover/card:border-border-subtle/80"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span className="inline-flex items-center px-[8px] py-[3px] border border-border-subtle bg-bg-primary font-mono text-[9px] font-semibold text-accent-cobalt">
                        +{project.technologies.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Action Link Footer */}
                  <div className="mt-[24px] pt-[16px] border-t border-border-subtle flex items-center justify-between">
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-[6px] font-mono text-[11px] font-semibold text-accent-cobalt hover:underline group/link"
                    >
                      <span>[ VIEW DETAILS ]</span>
                      <span className="inline-block transition-transform duration-200 group-hover/link:translate-x-1">
                        →
                      </span>
                    </Link>

                    <div className="flex items-center gap-[8px]">
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Live Demo"
                          className="font-mono text-[11px] text-text-secondary hover:text-accent-cobalt transition-colors p-[4px]"
                        >
                          ↗
                        </a>
                      )}
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Repository"
                          className="font-mono text-[11px] text-text-secondary hover:text-accent-cobalt transition-colors p-[4px]"
                        >
                          ⌥
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </main>

      {/* Global Footer */}
      <Footer brandName={brandName} />
    </div>
  );
}
