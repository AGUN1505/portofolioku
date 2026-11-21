import { SectionHeaderStrip } from "./SectionHeaderStrip";
import type { AboutProfile } from "../../../domain/entities";
import type { AboutDomainViewModel, AboutPillarViewModel } from "../../view-models";

interface AboutSectionProps {
  readonly profile: AboutProfile;
  readonly domains: ReadonlyArray<AboutDomainViewModel>;
  readonly pillars: ReadonlyArray<AboutPillarViewModel>;
  readonly sectionIndex?: string;
  readonly sectionCounter?: string;
}

export function AboutSection({
  profile,
  domains,
  pillars,
  sectionIndex = "02",
  sectionCounter = "SECTION 02 / 06",
}: AboutSectionProps) {
  return (
    <section
      id="about"
      aria-label="About and Philosophy"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      <SectionHeaderStrip
        indexLabel={`[ ${sectionIndex} // ABOUT & PHILOSOPHY ]`}
        subtitle="EDITORIAL PROFILE — SYSTEMS ENGINEERING & EDUCATION"
        counter={sectionCounter}
      />

      {/* DESKTOP ABOUT (1280px+: 2-Column Split, centered max-w 1440px) */}
      <div className="hidden xl:block w-full">
        <div className="mx-auto grid w-full max-w-[1440px] xl:min-h-[724px] xl:grid-cols-[minmax(380px,480px)_1fr] 2xl:grid-cols-[560px_1fr]">
          {/* Left Column */}
          <div className="min-w-0 border-r border-border-subtle xl:pl-[48px] xl:pr-[32px] 2xl:pl-[80px] 2xl:pr-[50px] pt-[52px] 2xl:pt-[56px] pb-[64px] 2xl:pb-[98px]">
            <h2 className="w-full max-w-[430px] font-sans xl:text-[42px] xl:leading-[50px] 2xl:text-[52px] 2xl:leading-[60px] font-bold tracking-[-0.02em] text-text-primary break-words">
              {profile.narratives.primary}
            </h2>

            <div className="mt-[48px]">
              <p className="font-mono text-[11px] leading-[13px] font-normal tracking-[0.02em] text-text-secondary">
                PRIMARY DOMAINS
              </p>
              <div className="mt-[12px] grid grid-cols-2 gap-[12px]">
                {domains.map((domain) => (
                  <div
                    key={domain.index}
                    className="flex min-h-[44px] items-center border border-border-subtle bg-white/50 hover:bg-white hover:border-accent-cobalt hover-card-swiss transition-all duration-300 px-[12px] py-[8px] group cursor-default"
                  >
                    <span className="shrink-0 font-mono text-[10px] leading-[12px] font-semibold text-accent-cobalt group-hover:scale-110 transition-transform duration-200">
                      {domain.index}
                    </span>
                    <span className="ml-[10px] min-w-0 font-sans text-[13px] leading-[16px] font-normal text-text-primary group-hover:text-accent-cobalt transition-colors duration-200 break-words">
                      {domain.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="min-w-0 xl:pl-[40px] xl:pr-[48px] 2xl:pl-[60px] 2xl:pr-[80px] pt-[52px] 2xl:pt-[56px] pb-[64px] 2xl:pb-[80px]">
            <p className="w-full max-w-[640px] font-sans xl:text-[21px] xl:leading-[34px] 2xl:text-[24px] 2xl:leading-[38px] font-normal text-text-secondary">
              {profile.quote}
            </p>

            <div className="mt-[52px] 2xl:mt-[64px] space-y-[40px] 2xl:space-y-[48px]">
              {pillars.map((pillar) => (
                <div key={pillar.index}>
                  <p
                    className={`font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] ${
                      pillar.accent ? "text-accent-cobalt" : "text-text-secondary"
                    }`}
                  >
                    {pillar.index}
                  </p>
                  <h3 className="mt-[12px] font-sans text-[24px] leading-[30px] 2xl:text-[28px] 2xl:leading-[34px] font-bold tracking-[-0.01em] text-text-primary">
                    {pillar.title}
                  </h3>
                  <p className="mt-[12px] w-full max-w-[640px] font-sans text-[16px] leading-[26px] font-normal text-text-secondary">
                    {pillar.desktopDesc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABLET ABOUT (768px - 1279px: Single Column Vertical Stack) */}
      <div className="hidden md:block xl:hidden mx-auto w-full max-w-[1440px] px-[40px] pt-[40px] pb-[48px]">
        <h2 className="max-w-[600px] font-sans text-[44px] leading-[52px] font-bold tracking-[-0.02em] text-text-primary break-words">
          {profile.narratives.primary}
        </h2>

        <p className="mt-[28px] max-w-[648px] font-sans text-[21px] leading-[34px] font-normal text-text-secondary">
          {profile.quote}
        </p>

        <div className="mt-[40px]">
          <p className="font-mono text-[10px] leading-[12px] font-normal tracking-[0.02em] text-text-secondary">
            PRIMARY DOMAINS
          </p>
          <div className="mt-[12px] grid grid-cols-2 gap-[12px]">
            {domains.map((domain) => (
              <div
                key={domain.index}
                className="flex min-h-[40px] items-center border border-border-subtle px-[12px] py-[8px]"
              >
                <span className="shrink-0 font-mono text-[9px] leading-[11px] font-semibold text-accent-cobalt">
                  {domain.index}
                </span>
                <span className="ml-[10px] min-w-0 font-sans text-[12px] leading-[15px] font-normal text-text-primary break-words">
                  {domain.tabletTitle || domain.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[48px] space-y-[40px]">
          {pillars.map((pillar) => (
            <div key={pillar.index}>
              <p
                className={`font-mono text-[9px] leading-[11px] font-semibold tracking-[0.03em] ${
                  pillar.accent ? "text-accent-cobalt" : "text-text-secondary"
                }`}
              >
                {pillar.index}
              </p>
              <h3 className="mt-[10px] font-sans text-[24px] leading-[29px] font-bold tracking-[-0.01em] text-text-primary">
                {pillar.title}
              </h3>
              <p className="mt-[10px] max-w-[648px] font-sans text-[15px] leading-[24px] font-normal text-text-secondary">
                {pillar.compactDesc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE ABOUT (< 768px: Single Column Stacked) */}
      <div className="md:hidden px-[16px] sm:px-[24px] pt-[28px] pb-[40px]">
        <h2 className="font-sans text-[28px] leading-[34px] sm:text-[32px] sm:leading-[38px] font-bold tracking-[-0.02em] text-text-primary break-words">
          {profile.narratives.primary}
        </h2>

        <p className="mt-[20px] font-sans text-[17px] leading-[28px] font-normal text-text-secondary">
          {profile.quote}
        </p>

        <div className="mt-[32px]">
          <p className="font-mono text-[9px] leading-[11px] font-normal tracking-[0.02em] text-text-secondary">
            PRIMARY DOMAINS
          </p>
          <div className="mt-[10px] grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
            {domains.map((domain) => (
              <div
                key={domain.index}
                className="flex min-h-[36px] items-center border border-border-subtle px-[12px] py-[8px]"
              >
                <span className="shrink-0 font-mono text-[9px] leading-[11px] font-semibold text-accent-cobalt">
                  {domain.index}
                </span>
                <span className="ml-[10px] min-w-0 font-sans text-[11.5px] leading-[15px] font-normal text-text-primary break-words">
                  {domain.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[36px] space-y-[32px]">
          {pillars.map((pillar) => (
            <div key={pillar.index}>
              <p
                className={`font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.03em] ${
                  pillar.accent ? "text-accent-cobalt" : "text-text-secondary"
                }`}
              >
                {pillar.index}
              </p>
              <h3 className="mt-[10px] font-sans text-[20px] leading-[24px] font-bold tracking-[-0.01em] text-text-primary">
                {pillar.title}
              </h3>
              <p className="mt-[10px] font-sans text-[14px] leading-[22px] font-normal text-text-secondary">
                {pillar.compactDesc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
