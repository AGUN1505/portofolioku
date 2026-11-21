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
          {channels.map((channel) => (
            <div
              key={channel.index}
              className={`flex min-h-[68px] ${channel.desktopWidth} max-w-full items-center border border-border-subtle bg-white/60 hover:bg-white hover:border-accent-cobalt hover-card-swiss transition-all duration-300 px-[24px] py-[12px] group`}
            >
              <span className="shrink-0 font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt group-hover:scale-110 transition-transform duration-200">
                {channel.index}
              </span>
              <span className="ml-[20px] shrink-0 font-mono text-[11px] leading-[13px] font-normal tracking-[0.02em] text-text-secondary group-hover:text-accent-cobalt transition-colors duration-200">
                {channel.label}
              </span>
              <span className="ml-[24px] 2xl:ml-[32px] min-w-0 flex-1 font-sans text-[15px] leading-[20px] font-normal text-text-primary group-hover:text-accent-cobalt transition-colors duration-200 break-all sm:break-words">
                {channel.value}
              </span>
            </div>
          ))}
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
          {channels.map((channel) => (
            <div
              key={channel.index}
              className={`flex min-h-[60px] ${channel.tabletWidth} max-w-full items-center border border-border-subtle px-[20px] py-[12px]`}
            >
              <span className="shrink-0 font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-accent-cobalt">
                {channel.index}
              </span>
              <span className="ml-[16px] shrink-0 font-mono text-[10px] leading-[12px] font-normal tracking-[0.02em] text-text-secondary">
                {channel.label}
              </span>
              <span className="ml-[20px] min-w-0 flex-1 font-sans text-[14px] leading-[19px] font-normal text-text-primary break-all sm:break-words">
                {channel.value}
              </span>
            </div>
          ))}
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
          {channels.map((channel) => (
            <div
              key={channel.index}
              className={`flex ${channel.mobileHeight} flex-col justify-center border border-border-subtle px-[16px] py-[12px]`}
            >
              <div className="flex items-center">
                <span className="shrink-0 font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.02em] text-accent-cobalt">
                  {channel.index}
                </span>
                <span className="ml-[12px] font-mono text-[9px] leading-[11px] font-normal tracking-[0.02em] text-text-secondary">
                  {channel.label}
                </span>
              </div>
              <p className="mt-[8px] min-w-0 font-sans text-[12.5px] leading-[17px] font-normal text-text-primary break-all">
                {channel.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
