import { SectionHeaderStrip } from "./SectionHeaderStrip";
import type { ContactProfile } from "../../../domain/entities";
import type { ContactChannelViewModel } from "../../view-models";

interface ContactSectionProps {
  readonly profile: ContactProfile;
  readonly channels: ReadonlyArray<ContactChannelViewModel>;
  readonly sectionIndex?: string;
  readonly sectionCounter?: string;
}

export function ContactSection({
  profile,
  channels,
  sectionIndex = "06",
  sectionCounter = "SECTION 06 / 06",
}: ContactSectionProps) {
  return (
    <section
      id="contact"
      aria-label="Contact Information"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      <SectionHeaderStrip
        indexLabel={`[ ${sectionIndex} // CONTACT ]`}
        subtitle="CONNECT — COLLABORATION & INQUIRY"
        counter={sectionCounter}
      />

      {/* DESKTOP CONTACT (1280px+, centered max-w 1440px) */}
      <div className="hidden xl:block mx-auto w-full max-w-[1440px] xl:px-[48px] 2xl:px-[80px] pt-[56px] pb-[80px]">
        <h2 className="w-full max-w-[720px] font-sans xl:text-[44px] xl:leading-[52px] 2xl:text-[52px] 2xl:leading-[60px] font-bold tracking-[-0.02em] text-text-primary break-words">
          {profile.heading}
        </h2>
        <p className="mt-[24px] w-full max-w-[720px] font-sans text-[18px] leading-[29px] font-normal text-text-secondary">
          {profile.description}
        </p>

        <div className="mt-[56px] space-y-[20px]">
          {channels.map((channel) => {
            const isExternal =
              channel.href.startsWith("http://") || channel.href.startsWith("https://");
            return (
              <a
                key={channel.index}
                href={channel.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                title={channel.value}
                aria-label={`${channel.label}: ${channel.value}`}
                className={`flex min-h-[64px] ${channel.desktopWidth} max-w-full items-center justify-between border border-border-subtle bg-white/70 hover:bg-white hover:border-accent-cobalt hover-card-swiss transition-all duration-300 px-[24px] py-[14px] group cursor-pointer`}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <span className="shrink-0 font-mono text-[11px] leading-[13px] font-semibold tracking-[0.02em] text-accent-cobalt group-hover:scale-110 transition-transform duration-200">
                    {channel.index}
                  </span>
                  <span className="ml-[20px] shrink-0 font-mono text-[13px] 2xl:text-[14px] leading-[18px] font-medium tracking-[0.04em] text-text-primary group-hover:text-accent-cobalt transition-colors duration-200 uppercase">
                    {channel.label}
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className="ml-[16px] shrink-0 font-mono text-[13px] text-text-secondary group-hover:text-accent-cobalt group-hover:translate-x-1.5 transition-all duration-200"
                >
                  -&gt;
                </span>
              </a>
            );
          })}
        </div>
      </div>

      {/* TABLET CONTACT (768px - 1279px) */}
      <div className="hidden md:block xl:hidden mx-auto w-full max-w-[1440px] px-[40px] pt-[40px] pb-[56px]">
        <h2 className="max-w-[620px] font-sans text-[44px] leading-[52px] font-bold tracking-[-0.02em] text-text-primary break-words">
          {profile.heading}
        </h2>
        <p className="mt-[20px] max-w-[648px] font-sans text-[17px] leading-[27px] font-normal text-text-secondary">
          {profile.description}
        </p>

        <div className="mt-[44px] space-y-[16px]">
          {channels.map((channel) => {
            const isExternal =
              channel.href.startsWith("http://") || channel.href.startsWith("https://");
            return (
              <a
                key={channel.index}
                href={channel.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                title={channel.value}
                aria-label={`${channel.label}: ${channel.value}`}
                className={`flex min-h-[58px] ${channel.tabletWidth} max-w-full items-center justify-between border border-border-subtle bg-white/70 hover:bg-white hover:border-accent-cobalt hover-card-swiss transition-all duration-200 px-[20px] py-[12px] group cursor-pointer`}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <span className="shrink-0 font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt">
                    {channel.index}
                  </span>
                  <span className="ml-[16px] shrink-0 font-mono text-[12px] leading-[16px] font-medium tracking-[0.04em] text-text-primary group-hover:text-accent-cobalt transition-colors duration-200 uppercase">
                    {channel.label}
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className="ml-[12px] shrink-0 font-mono text-[12px] text-text-secondary group-hover:text-accent-cobalt group-hover:translate-x-1 transition-all duration-200"
                >
                  -&gt;
                </span>
              </a>
            );
          })}
        </div>
      </div>

      {/* MOBILE CONTACT (< 768px) */}
      <div className="md:hidden px-[16px] sm:px-[24px] pt-[28px] pb-[40px]">
        <h2 className="font-sans text-[28px] leading-[34px] sm:text-[32px] sm:leading-[38px] font-bold tracking-[-0.02em] text-text-primary break-words">
          {profile.heading}
        </h2>
        <p className="mt-[16px] font-sans text-[15px] leading-[24px] font-normal text-text-secondary">
          {profile.description}
        </p>

        <div className="mt-[32px] space-y-[12px]">
          {channels.map((channel) => {
            const isExternal =
              channel.href.startsWith("http://") || channel.href.startsWith("https://");
            return (
              <a
                key={channel.index}
                href={channel.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                title={channel.value}
                aria-label={`${channel.label}: ${channel.value}`}
                className="flex min-h-[52px] sm:min-h-[56px] w-full items-center justify-between border border-border-subtle bg-white/70 hover:bg-white active:bg-accent-cobalt/5 hover:border-accent-cobalt active:border-accent-cobalt transition-all px-[16px] py-[12px] group cursor-pointer"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <span className="shrink-0 font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-accent-cobalt">
                    {channel.index}
                  </span>
                  <span className="ml-[14px] shrink-0 font-mono text-[11.5px] leading-[15px] font-medium tracking-[0.04em] text-text-primary group-hover:text-accent-cobalt transition-colors duration-200 uppercase">
                    {channel.label}
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className="ml-[12px] shrink-0 font-mono text-[11px] text-text-secondary group-hover:text-accent-cobalt group-hover:translate-x-0.5 transition-all duration-200"
                >
                  -&gt;
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
