import { SectionHeaderStrip } from "./SectionHeaderStrip";
import type { ExperienceViewModel } from "../../view-models";

interface ExperienceSectionProps {
  readonly experiences: ReadonlyArray<ExperienceViewModel>;
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  return (
    <section
      id="experience"
      aria-label="Professional Experience"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      <SectionHeaderStrip
        indexLabel="[ 04 // EXPERIENCE LEDGER ]"
        subtitle="PROFESSIONAL TRAJECTORY — EDUCATION & ENGINEERING"
        counter="SECTION 04 / 06"
      />

      {/* DESKTOP EXPERIENCE (1440px: 5-Column Grid Ledger) */}
      <div className="hidden xl:block px-[80px] pt-[48px] pb-[72px]">
        <div className="space-y-[20px]">
          {experiences.map((exp) => (
            <div key={exp.id} className="grid grid-cols-[80px_1fr_240px_160px] items-start gap-[24px] border-b border-border-subtle pb-[20px]">
              <div>
                <span className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt">
                  {exp.id}
                </span>
              </div>
              <div>
                <h3 className="font-sans text-[18px] leading-[22px] font-bold text-text-primary">
                  {exp.role}
                </h3>
              </div>
              <div>
                <p className="font-sans text-[14px] leading-[17px] font-normal text-text-secondary">
                  {exp.institution}
                </p>
              </div>
              <div className="flex items-center">
                <div className={`h-[1px] ${exp.ruleWidthClass} ${exp.accentRule ? "bg-accent-cobalt" : "bg-border-subtle"}`} />
                <span className={`ml-[12px] font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] whitespace-nowrap ${exp.accentRule ? "text-accent-cobalt" : "text-text-secondary"}`}>
                  {exp.track}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLET EXPERIENCE (768px: 2-Column Compact Grid) */}
      <div className="hidden md:grid xl:hidden grid-cols-2 gap-[32px] px-[40px] pt-[36px] pb-[48px]">
        {experiences.map((exp) => (
          <div key={exp.id} className="border-b border-border-subtle pb-[24px]">
            <span className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-accent-cobalt">
              {exp.id}
            </span>
            <h3 className="mt-[10px] font-sans text-[16px] leading-[19px] font-bold text-text-primary">
              {exp.role}
            </h3>
            <p className="mt-[8px] font-sans text-[13px] leading-[16px] font-normal text-text-secondary">
              {exp.institution}
            </p>
            <div className="mt-[12px] flex items-center">
              <div className={`h-[1px] w-[120px] ${exp.accentRule ? "bg-accent-cobalt" : "bg-border-subtle"}`} />
              <span className={`ml-[10px] font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] ${exp.accentRule ? "text-accent-cobalt" : "text-text-secondary"}`}>
                {exp.track}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE EXPERIENCE (390px: Single Column Stacked) */}
      <div className="md:hidden px-[24px] pt-[28px] pb-[40px] space-y-[28px]">
        {experiences.map((exp) => (
          <div key={exp.id} className="border-b border-border-subtle pb-[28px]">
            <span className="font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.02em] text-accent-cobalt">
              {exp.id}
            </span>
            <h3 className="mt-[10px] font-sans text-[15px] leading-[18px] font-bold text-text-primary">
              {exp.role}
            </h3>
            <p className="mt-[8px] font-sans text-[12px] leading-[14px] font-normal text-text-secondary">
              {exp.mobileInstitution || exp.institution}
            </p>
            <div className="mt-[12px] flex items-center">
              <div className={`h-[1px] w-[80px] ${exp.accentRule ? "bg-accent-cobalt" : "bg-border-subtle"}`} />
              <span className={`ml-[10px] font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.02em] ${exp.accentRule ? "text-accent-cobalt" : "text-text-secondary"}`}>
                {exp.track}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
