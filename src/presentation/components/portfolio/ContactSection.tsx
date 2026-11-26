import { SectionHeaderStrip } from "./SectionHeaderStrip";
import type { ContactProfile } from "../../../domain/entities";
import type { ContactChannelViewModel } from "../../view-models";

interface ContactSectionProps {
  readonly profile: ContactProfile;
  readonly channels: ReadonlyArray<ContactChannelViewModel>;
  readonly sectionIndex?: string;
  readonly sectionCounter?: string;
}

function ContactChannelButton({
  channel,
  variant,
}: {
  readonly channel: ContactChannelViewModel;
  readonly variant: "desktop" | "tablet" | "mobile";
}) {
  const isExternal =
    channel.href.startsWith("http://") || channel.href.startsWith("https://");

  const variantStyles = {
    desktop: {
      link: "min-h-[60px] 2xl:min-h-[64px] w-full duration-300 px-[24px] py-[14px] hover-card-swiss",
      index: "text-[11px] leading-[13px] group-hover:scale-110 transition-transform duration-200",
      label: "ml-[20px] text-[13px] 2xl:text-[14px] leading-[18px]",
      arrow: "ml-[16px] text-[13px] group-hover:translate-x-1.5",
    },
    tablet: {
      link: "min-h-[56px] w-full duration-200 px-[20px] py-[12px] hover-card-swiss",
      index: "text-[10px] leading-[12px]",
      label: "ml-[16px] text-[12px] leading-[16px]",
      arrow: "ml-[12px] text-[12px] group-hover:translate-x-1",
    },
    mobile: {
      link: "min-h-[52px] sm:min-h-[56px] w-full duration-200 px-[16px] py-[12px] active:bg-accent-cobalt/5 active:border-accent-cobalt",
      index: "text-[9px] leading-[11px]",
      label: "ml-[14px] text-[11.5px] leading-[15px]",
      arrow: "ml-[12px] text-[11px] group-hover:translate-x-0.5",
    },
  }[variant];

  return (
    <a
      href={channel.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      title={channel.value}
      aria-label={`${channel.label}: ${channel.value}`}
      className={`flex items-center justify-between border border-border-subtle bg-white/70 hover:bg-white hover:border-accent-cobalt transition-all group cursor-pointer ${variantStyles.link}`}
    >
      <div className="flex items-center min-w-0 flex-1">
        <span
          className={`shrink-0 font-mono font-semibold tracking-[0.02em] text-accent-cobalt ${variantStyles.index}`}
        >
          {channel.index}
        </span>
        <span
          className={`shrink-0 font-mono font-medium tracking-[0.04em] text-text-primary group-hover:text-accent-cobalt transition-colors duration-200 uppercase ${variantStyles.label}`}
        >
          {channel.label}
        </span>
      </div>
      <span
        aria-hidden="true"
        className={`shrink-0 font-mono text-text-secondary group-hover:text-accent-cobalt transition-all duration-200 ${variantStyles.arrow}`}
      >
        -&gt;
      </span>
    </a>
  );
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
      <div className="hidden xl:block mx-auto w-full max-w-[1440px] xl:px-[48px] 2xl:px-[80px] py-[56px] 2xl:py-[68px]">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(380px,460px)] 2xl:grid-cols-[minmax(0,1fr)_520px] items-center gap-[48px] 2xl:gap-[80px]">
          <div className="min-w-0">
            <h2 className="w-full max-w-[600px] font-sans xl:text-[44px] xl:leading-[52px] 2xl:text-[52px] 2xl:leading-[60px] font-bold tracking-[-0.02em] text-text-primary break-words">
              {profile.heading}
            </h2>
            <p className="mt-[20px] w-full max-w-[560px] font-sans text-[18px] leading-[29px] font-normal text-text-secondary">
              {profile.description}
            </p>
          </div>

          <div className="space-y-[14px] 2xl:space-y-[16px]">
            {channels.map((channel) => (
              <ContactChannelButton
                key={channel.index}
                channel={channel}
                variant="desktop"
              />
            ))}
          </div>
        </div>
      </div>

      {/* TABLET CONTACT (768px - 1279px) */}
      <div className="hidden md:block xl:hidden mx-auto w-full max-w-[1440px] px-[40px] py-[44px] lg:py-[52px]">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center gap-[32px] lg:gap-[40px]">
          <div className="min-w-0">
            <h2 className="max-w-[620px] font-sans text-[40px] lg:text-[44px] leading-[48px] lg:leading-[52px] font-bold tracking-[-0.02em] text-text-primary break-words">
              {profile.heading}
            </h2>
            <p className="mt-[18px] max-w-[600px] font-sans text-[17px] leading-[27px] font-normal text-text-secondary">
              {profile.description}
            </p>
          </div>

          <div className="space-y-[12px]">
            {channels.map((channel) => (
              <ContactChannelButton
                key={channel.index}
                channel={channel}
                variant="tablet"
              />
            ))}
          </div>
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

        <div className="mt-[28px] space-y-[12px]">
          {channels.map((channel) => (
            <ContactChannelButton
              key={channel.index}
              channel={channel}
              variant="mobile"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
