"use client";

import { useState } from "react";
import { SectionHeaderStrip } from "./SectionHeaderStrip";
import type { ExperienceViewModel } from "../../view-models";

interface ExperienceSectionProps {
  readonly experiences: ReadonlyArray<ExperienceViewModel>;
  readonly sectionIndex?: string;
  readonly sectionCounter?: string;
  readonly initialLimit?: number;
}

function ExperienceToggleButton({
  showAll,
  totalCount,
  initialLimit,
  variant,
  onToggle,
}: {
  readonly showAll: boolean;
  readonly totalCount: number;
  readonly initialLimit: number;
  readonly variant: "desktop" | "tablet" | "mobile";
  readonly onToggle: () => void;
}) {
  const variantStyles = {
    desktop: {
      wrapper: "mt-[48px] flex justify-center",
      button:
        "group inline-flex items-center gap-[12px] border border-border-subtle bg-bg-surface px-[32px] py-[16px] font-mono text-[11px] leading-[14px] font-semibold tracking-[0.05em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt hover:bg-white active:scale-98 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md",
    },
    tablet: {
      wrapper: "mt-[36px] flex justify-center",
      button:
        "group inline-flex items-center gap-[10px] border border-border-subtle bg-bg-surface px-[24px] py-[14px] font-mono text-[10px] leading-[13px] font-semibold tracking-[0.04em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt hover:bg-white active:scale-98 transition-all duration-200 cursor-pointer",
    },
    mobile: {
      wrapper: "mt-[28px] flex justify-center",
      button:
        "w-full group inline-flex items-center justify-center gap-[8px] border border-border-subtle bg-bg-surface px-[18px] py-[12px] font-mono text-[9.5px] leading-[12px] font-semibold tracking-[0.03em] text-text-primary hover:border-accent-cobalt hover:text-accent-cobalt hover:bg-white active:scale-98 transition-all duration-200 cursor-pointer",
    },
  }[variant];

  return (
    <div className={variantStyles.wrapper}>
      <button
        type="button"
        aria-expanded={showAll}
        onClick={onToggle}
        className={variantStyles.button}
      >
        <span className="inline-block transition-transform duration-200 group-hover:scale-110">
          {showAll ? "−" : "+"}
        </span>
        <span>
          {showAll
            ? `[ SHOW LESS // TOP ${initialLimit} ]`
            : `[ MORE EXPERIENCE // VIEW ALL (${totalCount}) ]`}
        </span>
      </button>
    </div>
  );
}

export function ExperienceSection({
  experiences,
  sectionIndex = "04",
  sectionCounter = "SECTION 04 / 06",
  initialLimit = 5,
}: ExperienceSectionProps) {
  const [showAll, setShowAll] = useState(false);

  const hasMore = experiences.length > initialLimit;
  const visibleExperiences = showAll ? experiences : experiences.slice(0, initialLimit);
  const handleToggle = () => setShowAll((prev) => !prev);

  return (
    <section
      id="experience"
      aria-label="Professional Experience"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      <SectionHeaderStrip
        indexLabel={`[ ${sectionIndex} // EXPERIENCE LEDGER ]`}
        subtitle="PROFESSIONAL TRAJECTORY — EDUCATION & ENGINEERING"
        counter={sectionCounter}
      />

      {/* DESKTOP EXPERIENCE (1280px+: 4-Column Grid Ledger, centered max-w 1440px) */}
      <div className="hidden xl:block mx-auto w-full max-w-[1440px] xl:px-[48px] 2xl:px-[80px] pt-[48px] pb-[72px]">
        <div className="space-y-[20px]">
          {visibleExperiences.map((exp, idx) => (
            <div
              key={exp.id}
              className="grid xl:grid-cols-[64px_minmax(0,1.2fr)_minmax(180px,220px)_minmax(220px,1fr)] 2xl:grid-cols-[80px_1fr_240px_320px] items-center gap-[20px] 2xl:gap-[24px] border-b border-border-subtle pb-[20px] px-2 hover:bg-white hover:border-accent-cobalt/40 transition-all duration-200 group"
            >
              <div className="min-w-0">
                <span className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt group-hover:scale-105 transition-transform duration-200">
                  {exp.displayIndex ?? String(idx + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="font-sans text-[18px] leading-[22px] font-bold text-text-primary group-hover:text-accent-cobalt transition-colors duration-200 break-words">
                  {exp.role}
                </h3>
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[14px] leading-[18px] font-normal text-text-secondary break-words">
                  {exp.institution}
                </p>
                {exp.period && (
                  <p className="font-mono text-[11px] leading-[14px] text-text-secondary/80 mt-1">
                    {exp.period}
                  </p>
                )}
              </div>
              <div className="flex min-w-0 items-center">
                <div
                  className={`h-[1px] max-w-[80px] 2xl:max-w-[140px] shrink ${exp.ruleWidthClass} ${
                    exp.accentRule ? "bg-accent-cobalt" : "bg-border-subtle"
                  }`}
                />
                <span
                  className={`ml-[12px] min-w-0 font-mono text-[10px] leading-[13px] font-semibold tracking-[0.02em] break-words ${
                    exp.accentRule ? "text-accent-cobalt" : "text-text-secondary"
                  }`}
                >
                  {exp.track}
                </span>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <ExperienceToggleButton
            showAll={showAll}
            totalCount={experiences.length}
            initialLimit={initialLimit}
            variant="desktop"
            onToggle={handleToggle}
          />
        )}
      </div>

      {/* TABLET EXPERIENCE (768px - 1279px: 2-Column Compact Grid) */}
      <div className="hidden md:block xl:hidden mx-auto w-full max-w-[1440px] px-[40px] pt-[36px] pb-[48px]">
        <div className="grid grid-cols-2 gap-[32px]">
          {visibleExperiences.map((exp, idx) => (
            <div key={exp.id} className="min-w-0 border-b border-border-subtle pb-[24px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-accent-cobalt">
                  {exp.displayIndex ?? String(idx + 1).padStart(2, "0")}
                </span>
                {exp.period && (
                  <span className="font-mono text-[10px] leading-[12px] text-text-secondary">
                    {exp.period}
                  </span>
                )}
              </div>
              <h3 className="mt-[10px] font-sans text-[16px] leading-[19px] font-bold text-text-primary break-words">
                {exp.role}
              </h3>
              <p className="mt-[8px] font-sans text-[13px] leading-[16px] font-normal text-text-secondary break-words">
                {exp.institution}
              </p>
              <div className="mt-[12px] flex min-w-0 items-center">
                <div
                  className={`h-[1px] w-[60px] lg:w-[100px] shrink-0 ${
                    exp.accentRule ? "bg-accent-cobalt" : "bg-border-subtle"
                  }`}
                />
                <span
                  className={`ml-[10px] min-w-0 font-mono text-[9px] leading-[12px] font-semibold tracking-[0.02em] break-words ${
                    exp.accentRule ? "text-accent-cobalt" : "text-text-secondary"
                  }`}
                >
                  {exp.track}
                </span>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <ExperienceToggleButton
            showAll={showAll}
            totalCount={experiences.length}
            initialLimit={initialLimit}
            variant="tablet"
            onToggle={handleToggle}
          />
        )}
      </div>

      {/* MOBILE EXPERIENCE (< 768px: Single Column Stacked) */}
      <div className="md:hidden px-[16px] sm:px-[24px] pt-[28px] pb-[40px]">
        <div className="space-y-[28px]">
          {visibleExperiences.map((exp, idx) => (
            <div key={exp.id} className="border-b border-border-subtle pb-[28px] last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.02em] text-accent-cobalt">
                  {exp.displayIndex ?? String(idx + 1).padStart(2, "0")}
                </span>
                {exp.period && (
                  <span className="font-mono text-[9.5px] leading-[12px] text-text-secondary">
                    {exp.period}
                  </span>
                )}
              </div>
              <h3 className="mt-[10px] font-sans text-[15px] leading-[18px] font-bold text-text-primary break-words">
                {exp.role}
              </h3>
              <p className="mt-[8px] font-sans text-[12px] leading-[15px] font-normal text-text-secondary break-words">
                {exp.mobileInstitution || exp.institution}
              </p>
              <div className="mt-[12px] flex min-w-0 items-center">
                <div
                  className={`h-[1px] w-[48px] sm:w-[80px] shrink-0 ${
                    exp.accentRule ? "bg-accent-cobalt" : "bg-border-subtle"
                  }`}
                />
                <span
                  className={`ml-[10px] min-w-0 font-mono text-[8.5px] leading-[11px] font-semibold tracking-[0.02em] break-words ${
                    exp.accentRule ? "text-accent-cobalt" : "text-text-secondary"
                  }`}
                >
                  {exp.track}
                </span>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <ExperienceToggleButton
            showAll={showAll}
            totalCount={experiences.length}
            initialLimit={initialLimit}
            variant="mobile"
            onToggle={handleToggle}
          />
        )}
      </div>
    </section>
  );
}
