import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CompositionRoot } from "@/src/infrastructure/composition-root";
import { Footer } from "@/src/presentation/components/portfolio/Footer";

export const instant = false;

interface ProjectDetailPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const portfolio = await CompositionRoot.getResilientPortfolioUseCase().execute();
  const normalized = id.startsWith("project_") ? id.replace("project_", "") : id;
  const project = portfolio.projects.find(
    (p) => p.id === id || p.id === normalized || p.id === `project_${id}`
  );

  if (!project) {
    return {
      title: "Project Not Found — Agun Firmansyah",
      description: "The requested project case study could not be found.",
    };
  }

  return {
    title: `${project.title} — Project Case Study`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  await connection();
  const { id } = await params;
  const portfolio = await CompositionRoot.getResilientPortfolioUseCase().execute();
  const normalized = id.startsWith("project_") ? id.replace("project_", "") : id;

  const currentIndex = portfolio.projects.findIndex(
    (p) => p.id === id || p.id === normalized || p.id === `project_${id}`
  );

  if (currentIndex === -1) {
    notFound();
  }

  const project = portfolio.projects[currentIndex];
  const prevProject = currentIndex > 0 ? portfolio.projects[currentIndex - 1] : null;
  const nextProject =
    currentIndex < portfolio.projects.length - 1
      ? portfolio.projects[currentIndex + 1]
      : null;

  const brandName = portfolio.hero.name || "AGUN FIRMANSYAH";

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* Top Navigation Bar */}
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

          <div className="flex items-center gap-[16px]">
            <Link
              href="/#projects"
              className="group inline-flex items-center gap-[8px] border border-border-subtle bg-bg-primary px-[14px] sm:px-[18px] py-[8px] font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.04em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt transition-colors duration-200"
            >
              <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
                ←
              </span>
              <span>[ BACK TO ALL PROJECTS ]</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto max-w-[1440px] px-[16px] sm:px-[32px] lg:px-[64px] py-[40px] sm:py-[64px] 2xl:py-[80px]">
        {/* Breadcrumb / Spec Index */}
        <div className="flex items-center gap-[8px] font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.05em] text-text-secondary">
          <Link href="/" className="hover:text-accent-cobalt transition-colors">
            PORTFOLIO
          </Link>
          <span>//</span>
          <Link href="/#projects" className="hover:text-accent-cobalt transition-colors">
            PROJECTS
          </Link>
          <span>//</span>
          <span className="text-accent-cobalt uppercase">
            {project.id}
          </span>
        </div>

        {/* Title & Category Header */}
        <div className="mt-[24px] sm:mt-[32px] border-b border-border-subtle pb-[32px] sm:pb-[48px]">
          <p className="font-mono text-[11px] sm:text-[12px] font-semibold tracking-[0.06em] text-accent-cobalt">
            // {project.category.toUpperCase()}
          </p>
          <h1 className="mt-[16px] font-sans text-[32px] sm:text-[44px] lg:text-[54px] leading-[1.1] font-bold tracking-[-0.02em] text-text-primary break-words">
            {project.title}
          </h1>
          <p className="mt-[20px] sm:mt-[24px] max-w-[900px] font-sans text-[16px] sm:text-[18px] leading-[28px] sm:leading-[30px] font-normal text-text-secondary">
            {project.description}
          </p>

          {/* Quick Action Buttons (Live Demo & Source Code) */}
          <div className="mt-[32px] flex flex-wrap gap-[12px]">
            {project.projectUrl && (
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-[8px] bg-accent-cobalt text-white px-[20px] py-[10px] font-mono text-[11px] font-semibold tracking-[0.04em] hover:bg-accent-cobalt/90 transition-all duration-200 shadow-sm"
              >
                <span>[ ↗ LIVE DEMO / PRODUCTION ]</span>
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-[8px] border border-border-subtle bg-bg-surface px-[20px] py-[10px] font-mono text-[11px] font-semibold tracking-[0.04em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt transition-all duration-200"
              >
                <span>[ ⌥ SOURCE CODE / REPO ]</span>
              </a>
            )}
            <Link
              href="/#contact"
              className="group inline-flex items-center gap-[8px] border border-border-subtle bg-bg-surface px-[20px] py-[10px] font-mono text-[11px] font-semibold tracking-[0.04em] text-text-secondary hover:border-accent-cobalt hover:text-accent-cobalt transition-all duration-200"
            >
              <span>[ GET IN TOUCH / INQUIRE ]</span>
            </Link>
          </div>
        </div>

        {/* Telemetry / Specification Sheet */}
        <div className="mt-[36px] sm:mt-[48px] grid grid-cols-2 md:grid-cols-4 gap-[16px] sm:gap-[24px] border border-border-subtle bg-bg-surface p-[20px] sm:p-[28px]">
          <div>
            <p className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
              CATEGORY
            </p>
            <p className="mt-[6px] font-sans text-[13px] sm:text-[14px] font-semibold text-text-primary">
              {project.category}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
              DEPLOYMENT STATUS
            </p>
            <div className="mt-[6px] flex items-center gap-[6px]">
              <span className="h-[7px] w-[7px] rounded-full bg-emerald-500 animate-pulse" />
              <p className="font-sans text-[13px] sm:text-[14px] font-semibold text-text-primary">
                Active / Deployed
              </p>
            </div>
          </div>
          <div>
            <p className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
              TECHNOLOGIES COUNT
            </p>
            <p className="mt-[6px] font-sans text-[13px] sm:text-[14px] font-semibold text-text-primary">
              {project.technologies.length} Stack Components
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
              SYSTEM ARCHITECTURE
            </p>
            <p className="mt-[6px] font-sans text-[13px] sm:text-[14px] font-semibold text-text-primary">
              Modern Full-Stack
            </p>
          </div>
        </div>

        {/* Preview Frame Showcase */}
        <div className="mt-[48px] sm:mt-[64px] border border-border-subtle overflow-hidden bg-bg-surface">
          <div className="flex min-h-[36px] items-center justify-between border-b border-border-subtle px-[16px] py-[8px] bg-bg-surface">
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.03em] text-text-secondary">
              PREVIEW INTERFACE // {project.title.toUpperCase()}
            </span>
            <div className="flex items-center gap-[6px]">
              <span className="h-[8px] w-[8px] rounded-full bg-border-subtle" />
              <span className="h-[8px] w-[8px] rounded-full bg-border-subtle" />
              <span className="h-[8px] w-[8px] rounded-full bg-accent-cobalt" />
            </div>
          </div>

          <div className="flex min-h-[300px] sm:min-h-[460px] 2xl:min-h-[560px] items-center justify-center bg-bg-primary overflow-hidden">
            {project.thumbnailUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover max-h-[640px]"
              />
            ) : (
              <div className="py-[64px] sm:py-[96px] text-center px-[24px] max-w-[600px]">
                <div className="mx-auto flex h-[56px] w-[56px] items-center justify-center border border-border-subtle bg-bg-surface text-accent-cobalt font-mono text-[18px]">
                  [ 01 ]
                </div>
                <h3 className="mt-[20px] font-sans text-[18px] sm:text-[22px] font-bold text-text-primary">
                  {project.title}
                </h3>
                <p className="mt-[8px] font-mono text-[11px] sm:text-[12px] text-text-secondary">
                  Interactive preview container. Project screenshot can be uploaded via Admin CMS.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Technology Stack Badges */}
        <div className="mt-[48px] sm:mt-[64px]">
          <h2 className="font-mono text-[12px] sm:text-[13px] font-semibold tracking-[0.05em] text-text-secondary">
            [ TECH STACK & ENGINEERING COMPONENTS ]
          </h2>
          <div className="mt-[16px] flex flex-wrap gap-[10px]">
            {project.technologies.map((tech, idx) => (
              <span
                key={idx}
                className="inline-flex items-center justify-center border border-border-subtle bg-bg-surface px-[14px] py-[6px] font-mono text-[11px] sm:text-[12px] font-semibold tracking-[0.03em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt hover:bg-white transition-colors duration-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Case Study Details Grid */}
        <div className="mt-[48px] sm:mt-[64px] grid grid-cols-1 md:grid-cols-2 gap-[32px] sm:gap-[48px] border-t border-border-subtle pt-[40px] sm:pt-[56px]">
          <div className="border border-border-subtle p-[24px] sm:p-[32px] bg-bg-surface">
            <h3 className="font-mono text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.05em] text-accent-cobalt">
              // 01. CORE SYSTEM OBJECTIVE
            </h3>
            <p className="mt-[16px] font-sans text-[15px] sm:text-[16px] leading-[26px] text-text-secondary">
              Aplikasi ini dirancang untuk mengatasi tantangan pemrosesan data, kemudahan interaksi pengguna, dan keandalan sistem secara terukur. Dilengkapi arsitektur modular yang memudahkan pemeliharaan jangka panjang.
            </p>
          </div>

          <div className="border border-border-subtle p-[24px] sm:p-[32px] bg-bg-surface">
            <h3 className="font-mono text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.05em] text-accent-cobalt">
              // 02. ARCHITECTURAL HIGHLIGHTS
            </h3>
            <ul className="mt-[16px] space-y-[10px] font-sans text-[14px] sm:text-[15px] leading-[24px] text-text-secondary">
              <li className="flex items-start gap-[8px]">
                <span className="font-mono text-accent-cobalt shrink-0">▸</span>
                <span>Penerapan standar clean code dan pemisahan lapisan (separation of concerns).</span>
              </li>
              <li className="flex items-start gap-[8px]">
                <span className="font-mono text-accent-cobalt shrink-0">▸</span>
                <span>Optimasi kinerja respon antarmuka dan penanganan data secara efisien.</span>
              </li>
              <li className="flex items-start gap-[8px]">
                <span className="font-mono text-accent-cobalt shrink-0">▸</span>
                <span>Struktur kode modular untuk kemudahan deployment dan skalabilitas masa depan.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Next / Previous Project Navigation */}
        <div className="mt-[64px] sm:mt-[80px] border-t border-border-subtle pt-[40px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-[16px]">
          {prevProject ? (
            <Link
              href={`/projects/${prevProject.id}`}
              className="group flex-1 flex flex-col items-start border border-border-subtle bg-bg-surface p-[18px] sm:p-[24px] hover:border-accent-cobalt transition-colors duration-200"
            >
              <span className="font-mono text-[10px] text-text-secondary group-hover:text-accent-cobalt">
                ← PREVIOUS PROJECT
              </span>
              <span className="mt-[4px] font-sans text-[15px] sm:text-[16px] font-bold text-text-primary group-hover:text-accent-cobalt transition-colors">
                {prevProject.title}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextProject ? (
            <Link
              href={`/projects/${nextProject.id}`}
              className="group flex-1 flex flex-col items-end border border-border-subtle bg-bg-surface p-[18px] sm:p-[24px] hover:border-accent-cobalt transition-colors duration-200"
            >
              <span className="font-mono text-[10px] text-text-secondary group-hover:text-accent-cobalt">
                NEXT PROJECT →
              </span>
              <span className="mt-[4px] font-sans text-[15px] sm:text-[16px] font-bold text-text-primary group-hover:text-accent-cobalt transition-colors">
                {nextProject.title}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </main>

      {/* Global Footer */}
      <Footer brandName={brandName} />
    </div>
  );
}
