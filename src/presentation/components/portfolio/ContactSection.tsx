import { SectionHeaderStrip } from "./SectionHeaderStrip";
import type { ContactProfile } from "../../../domain/entities";
import type { ContactChannelViewModel } from "../../view-models";

interface ContactSectionProps {
  readonly profile: ContactProfile;
  readonly channels: ReadonlyArray<ContactChannelViewModel>;
}

export function ContactSection({ profile, channels }: ContactSectionProps) {
  return (
    <section
      id="contact"
      aria-label="Contact Information"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      <SectionHeaderStrip
        indexLabel="[ 06 // CONTACT ]"
        subtitle="CONNECT — COLLABORATION & INQUIRY"
        counter="SECTION 06 / 06"
      />

      {/* DESKTOP CONTACT (1440px) */}
      <div className="hidden xl:block px-[80px] pt-[56px] pb-[80px]">
        <h2 className="w-[720px] font-sans text-[52px] leading-[60px] font-bold tracking-[-0.02em] text-text-primary">
          {profile.heading}
        </h2>
        <p className="mt-[24px] w-[720px] font-sans text-[18px] leading-[29px] font-normal text-text-secondary">
          {profile.description}
        </p>

        <div className="mt-[56px] space-y-[20px]">
          {channels.map((channel) => (
            <div
              key={channel.index}
              className={`flex h-[68px] ${channel.desktopWidth} items-center border border-border-subtle px-[24px]`}
            >
              <span className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt">
                {channel.index}
              </span>
              <span className="ml-[20px] font-mono text-[11px] leading-[13px] font-normal tracking-[0.02em] text-text-secondary">
                {channel.label}
              </span>
              <span className="ml-[32px] font-sans text-[15px] leading-[18px] font-normal text-text-primary">
                {channel.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* TABLET CONTACT (768px) */}
      <div className="hidden md:block xl:hidden px-[40px] pt-[40px] pb-[56px]">
        <h2 className="max-w-[620px] font-sans text-[44px] leading-[52px] font-bold tracking-[-0.02em] text-text-primary">
          {profile.heading}
        </h2>
        <p className="mt-[20px] max-w-[648px] font-sans text-[17px] leading-[27px] font-normal text-text-secondary">
          {profile.description}
        </p>

        <div className="mt-[44px] space-y-[16px]">
          {channels.map((channel) => (
            <div
              key={channel.index}
              className={`flex h-[60px] ${channel.tabletWidth} items-center border border-border-subtle px-[20px]`}
            >
              <span className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-accent-cobalt">
                {channel.index}
              </span>
              <span className="ml-[16px] font-mono text-[10px] leading-[12px] font-normal tracking-[0.02em] text-text-secondary">
                {channel.label}
              </span>
              <span className="ml-[24px] font-sans text-[14px] leading-[17px] font-normal text-text-primary">
                {channel.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE CONTACT (390px) */}
      <div className="md:hidden px-[24px] pt-[28px] pb-[40px]">
        <h2 className="font-sans text-[32px] leading-[38px] font-bold tracking-[-0.02em] text-text-primary">
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
                <span className="font-mono text-[8.5px] leading-[10px] font-semibold tracking-[0.02em] text-accent-cobalt">
                  {channel.index}
                </span>
                <span className="ml-[12px] font-mono text-[9px] leading-[11px] font-normal tracking-[0.02em] text-text-secondary">
                  {channel.label}
                </span>
              </div>
              <p className="mt-[8px] font-sans text-[12.5px] leading-[15px] font-normal text-text-primary">
                {channel.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
