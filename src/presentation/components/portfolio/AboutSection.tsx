import { SectionHeaderStrip } from "./SectionHeaderStrip";
import type { AboutProfile } from "../../../domain/entities";
import type { AboutDomainViewModel, AboutPillarViewModel } from "../../view-models";

interface AboutSectionProps {
  readonly profile: AboutProfile;
  readonly domains: ReadonlyArray<AboutDomainViewModel>;
  readonly pillars: ReadonlyArray<AboutPillarViewModel>;
}

export function AboutSection({ profile, domains, pillars }: AboutSectionProps) {
  return (
    <section
      id="about"
      aria-label="About and Philosophy"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      <SectionHeaderStrip
        indexLabel="[ 02 // ABOUT & PHILOSOPHY ]"
        subtitle="EDITORIAL PROFILE — SYSTEMS ENGINEERING & EDUCATION"
        counter="SECTION 02 / 06"
      />

      {/* DESKTOP ABOUT (1440px: 2-Column Split at x:560, height 724px) */}
      <div className="hidden xl:grid xl:min-h-[724px] xl:grid-cols-[560px_1fr]">
        {/* Left Column (560px) */}
        <div className="border-r border-border-subtle pl-[80px] pr-[50px] pt-[56px] pb-[98px]">
          <h2 className="w-[430px] font-sans text-[52px] leading-[60px] font-bold tracking-[-0.02em] text-text-primary">
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
                  className="flex h-[44px] items-center border border-border-subtle px-[12px]"
                >
                  <span className="font-mono text-[10px] leading-[12px] font-semibold text-accent-cobalt">
                    {domain.index}
                  </span>
                  <span className="ml-[10px] font-sans text-[13px] leading-[16px] font-normal text-text-primary">
                    {domain.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1fr) */}
        <div className="pl-[60px] pr-[80px] pt-[56px] pb-[80px]">
          <p className="w-[640px] font-sans text-[24px] leading-[38px] font-normal text-text-secondary">
            {profile.quote}
          </p>

          <div className="mt-[64px] space-y-[48px]">
            {pillars.map((pillar) => (
              <div key={pillar.index}>
                <p
                  className={`font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] ${
                    pillar.accent ? "text-accent-cobalt" : "text-text-secondary"
                  }`}
                >
                  {pillar.index}
                </p>
                <h3 className="mt-[12px] font-sans text-[28px] leading-[34px] font-bold tracking-[-0.01em] text-text-primary">
                  {pillar.title}
                </h3>
                <p className="mt-[12px] w-[640px] font-sans text-[16px] leading-[26px] font-normal text-text-secondary">
                  {pillar.desktopDesc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLET ABOUT (768px: Single Column Vertical Stack) */}
      <div className="hidden md:block xl:hidden px-[40px] pt-[40px] pb-[48px]">
        <h2 className="max-w-[600px] font-sans text-[44px] leading-[52px] font-bold tracking-[-0.02em] text-text-primary">
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
                className="flex h-[40px] items-center border border-border-subtle px-[12px]"
              >
                <span className="font-mono text-[9px] leading-[11px] font-semibold text-accent-cobalt">
                  {domain.index}
                </span>
                <span className="ml-[10px] font-sans text-[12px] leading-[14px] font-normal text-text-primary">
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

      {/* MOBILE ABOUT (390px: Single Column Stacked) */}
      <div className="md:hidden px-[24px] pt-[28px] pb-[40px]">
        <h2 className="font-sans text-[32px] leading-[38px] font-bold tracking-[-0.02em] text-text-primary">
          {profile.narratives.primary}
        </h2>

        <p className="mt-[20px] font-sans text-[17px] leading-[28px] font-normal text-text-secondary">
          {profile.quote}
        </p>

        <div className="mt-[32px]">
          <p className="font-mono text-[9px] leading-[11px] font-normal tracking-[0.02em] text-text-secondary">
            PRIMARY DOMAINS
          </p>
          <div className="mt-[10px] space-y-[8px]">
            {domains.map((domain) => (
              <div
                key={domain.index}
                className="flex h-[36px] items-center border border-border-subtle px-[12px]"
              >
                <span className="font-mono text-[9px] leading-[11px] font-semibold text-accent-cobalt">
                  {domain.index}
                </span>
                <span className="ml-[10px] font-sans text-[11.5px] leading-[14px] font-normal text-text-primary">
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
