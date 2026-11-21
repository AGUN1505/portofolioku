import { SectionHeaderStrip } from "./SectionHeaderStrip";
import type { SkillTaxonomy } from "../../../domain/entities";

interface SkillsSectionProps {
  readonly taxonomy: SkillTaxonomy;
  readonly viewConfig: ReadonlyArray<{
    readonly desktopIndex: string;
    readonly tabletTitle: string;
    readonly mobileTitle: string;
    readonly ruleWidthClass: string;
    readonly accentRule: boolean;
  }>;
  readonly sectionIndex?: string;
  readonly sectionCounter?: string;
}

function resolveCategoryViewConfig(
  viewConfig: SkillsSectionProps["viewConfig"],
  categoryTitle: string,
  idx: number
) {
  const existing = viewConfig[idx];
  if (existing) {
    return existing;
  }

  const formattedIndex = String(idx + 1).padStart(2, "0");
  const fallbackLabel = `${formattedIndex} // ${categoryTitle.toUpperCase()}`;

  return {
    desktopIndex: fallbackLabel,
    tabletTitle: fallbackLabel,
    mobileTitle: fallbackLabel,
    ruleWidthClass: "w-[260px]",
    accentRule: false,
  };
}

export function SkillsSection({
  taxonomy,
  viewConfig,
  sectionIndex = "05",
  sectionCounter = "SECTION 05 / 06",
}: SkillsSectionProps) {
  return (
    <section
      id="skills"
      aria-label="Technical Capabilities"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      <SectionHeaderStrip
        indexLabel={`[ ${sectionIndex} // TECHNICAL CAPABILITIES ]`}
        subtitle="TECHNOLOGY STACK — BACKEND • FRONTEND • DATABASE • TOOLS"
        counter={sectionCounter}
      />

      {/* DESKTOP SKILLS (1280px+: 4-Column Grid, centered max-w 1440px) */}
      <div className="hidden xl:grid mx-auto w-full max-w-[1440px] xl:grid-cols-4 gap-[24px] xl:px-[48px] 2xl:px-[80px] pt-[48px] pb-[72px]">
        {taxonomy.categories.map((category, idx) => {
          const config = resolveCategoryViewConfig(viewConfig, category.title, idx);
          const categoryKey = category.title ? `cat-desktop-${category.title}-${idx}` : `cat-desktop-${idx}`;
          return (
            <div key={categoryKey} className="min-w-0">
              <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-text-secondary">
                {config.desktopIndex}
              </p>
              <h3 className="mt-[14px] font-sans text-[18px] leading-[22px] font-bold text-text-primary break-words">
                {category.title}
              </h3>
              <div className={`mt-[14px] h-[1px] max-w-full ${config.ruleWidthClass} ${config.accentRule ? "bg-accent-cobalt" : "bg-border-subtle"}`} />
              <ul className="mt-[16px] space-y-[10px]">
                {category.skills.map((skill, skillIdx) => (
                  <li
                    key={skill ? `skill-desktop-${category.title}-${skill}-${skillIdx}` : `skill-desktop-${skillIdx}`}
                    className="font-sans text-[14px] leading-[17px] font-normal text-text-secondary hover:text-accent-cobalt hover:translate-x-1.5 transition-all duration-200 cursor-default break-words"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* TABLET SKILLS (768px - 1279px: 2-Column Grid) */}
      <div className="hidden md:grid xl:hidden mx-auto w-full max-w-[1440px] grid-cols-2 gap-[32px] px-[40px] pt-[36px] pb-[48px]">
        {taxonomy.categories.map((category, idx) => {
          const config = resolveCategoryViewConfig(viewConfig, category.title, idx);
          const categoryKey = category.title ? `cat-tablet-${category.title}-${idx}` : `cat-tablet-${idx}`;
          return (
            <div key={categoryKey} className="min-w-0">
              <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.03em] text-text-secondary">
                {config.tabletTitle}
              </p>
              <h3 className="mt-[12px] font-sans text-[16px] leading-[19px] font-bold text-text-primary break-words">
                {category.title}
              </h3>
              <div className={`mt-[12px] h-[1px] max-w-full w-[200px] ${config.accentRule ? "bg-accent-cobalt" : "bg-border-subtle"}`} />
              <ul className="mt-[14px] space-y-[8px]">
                {category.skills.map((skill, skillIdx) => (
                  <li
                    key={skill ? `skill-tablet-${category.title}-${skill}-${skillIdx}` : `skill-tablet-${skillIdx}`}
                    className="font-sans text-[13px] leading-[16px] font-normal text-text-secondary break-words"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* MOBILE SKILLS (< 768px: Responsive 1-to-2 Column Grid) */}
      <div className="md:hidden px-[16px] sm:px-[24px] pt-[28px] pb-[40px] grid grid-cols-1 sm:grid-cols-2 gap-[28px]">
        {taxonomy.categories.map((category, idx) => {
          const config = resolveCategoryViewConfig(viewConfig, category.title, idx);
          const categoryKey = category.title ? `cat-mobile-${category.title}-${idx}` : `cat-mobile-${idx}`;
          return (
            <div key={categoryKey} className="min-w-0">
              <p className="font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.03em] text-text-secondary">
                {config.mobileTitle}
              </p>
              <h3 className="mt-[10px] font-sans text-[15px] leading-[18px] font-bold text-text-primary break-words">
                {category.title}
              </h3>
              <div className={`mt-[10px] h-[1px] max-w-full w-[120px] ${config.accentRule ? "bg-accent-cobalt" : "bg-border-subtle"}`} />
              <ul className="mt-[12px] space-y-[8px]">
                {category.skills.map((skill, skillIdx) => (
                  <li
                    key={skill ? `skill-mobile-${category.title}-${skill}-${skillIdx}` : `skill-mobile-${skillIdx}`}
                    className="font-sans text-[12px] leading-[15px] font-normal text-text-secondary break-words"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
