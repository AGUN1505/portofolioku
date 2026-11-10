import type { HeroProfile } from "../../../domain/entities";
import type { HeroRoleViewModel, EngineeringNodeViewModel } from "../../view-models";

interface HeroSectionProps {
  readonly profile: HeroProfile;
  readonly roles: ReadonlyArray<HeroRoleViewModel>;
  readonly nodes: ReadonlyArray<EngineeringNodeViewModel>;
}

export function HeroSection({ profile, roles, nodes }: HeroSectionProps) {
  return (
    <section
      id="hero"
      aria-label="Identity and Hero"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      {/* DESKTOP HERO (1440px: 3 Asymmetric Zones) */}
      <div className="hidden xl:grid xl:min-h-[764px] xl:grid-cols-[380px_600px_1fr]">
        {/* Zone 1: Left Identity & Roles (380px) */}
        <div className="flex flex-col justify-between border-r border-border-subtle pl-[80px] pr-[32px] pt-[64px] pb-[79px]">
          <div>
            <p className="font-mono text-[11px] leading-[13px] font-semibold tracking-[0.02em] text-accent-cobalt">
              [ 01 // IDENTITY ]
            </p>

            <p className="mt-[39px] font-mono text-[11px] leading-[13px] font-normal tracking-[0.02em] text-text-secondary">
              POSITIONING &amp; ROLES
            </p>

            <ul className="mt-[13px] w-[268px] border-t border-border-subtle">
              {roles.map((role) => (
                <li
                  key={role.index}
                  className="flex h-[44px] items-center border-b border-border-subtle"
                >
                  <span
                    className={`w-[13px] font-mono text-[11px] leading-[13px] ${
                      role.primary
                        ? "font-semibold text-accent-cobalt"
                        : "font-normal text-text-secondary"
                    }`}
                  >
                    {role.index}
                  </span>
                  <span
                    className={`ml-[19px] font-sans text-[14px] leading-[17px] text-text-primary ${
                      role.primary ? "font-semibold" : "font-normal"
                    }`}
                  >
                    {role.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] leading-[13px] font-normal tracking-[0.02em] text-text-secondary">
              LOCATION / BASE
            </p>
            <p className="mt-[12px] font-sans text-[16px] leading-[19px] font-semibold text-text-primary">
              {profile.location.country}
            </p>
            <p className="mt-[6px] font-mono text-[11px] leading-[13px] font-normal tracking-[0.02em] text-text-secondary">
              {profile.location.code} {" // "} {profile.location.timezone}
            </p>
            <p className="mt-[32px] font-mono text-[11px] leading-[13px] font-semibold tracking-[0.02em] text-text-secondary">
              APPROACH // INTENTIONAL ENGINEERING
            </p>
          </div>
        </div>

        {/* Zone 2: Center Main Hero Content (600px) */}
        <div className="flex flex-col border-r border-border-subtle">
          <div className="flex-1 pl-[40px] pr-[65px] pt-[64px] pb-[48px]">
            <p className="font-mono text-[11px] leading-[13px] font-semibold tracking-[0.02em] text-accent-cobalt">
              [ AGUN FIRMANSYAH — PERSONAL PORTFOLIO ]
            </p>
            <h1 className="mt-[46px] font-sans text-[58px] leading-[64px] font-bold tracking-[-0.02em] text-text-primary whitespace-pre-line">
              {profile.tagline}
            </h1>
            <div className="mt-[16px] h-[4px] w-[280px] bg-accent-cobalt"></div>
            <p className="mt-[32px] w-[480px] font-sans text-[18px] leading-[29px] font-normal text-text-secondary">
              {profile.bio}
            </p>
            <div className="mt-[40px] flex items-center gap-[20px]">
              <a
                href="#projects"
                className="inline-flex h-[48px] items-center justify-center bg-accent-cobalt px-[32px] font-mono text-[13px] leading-[16px] font-semibold tracking-[0.01em] text-bg-primary whitespace-pre"
              >
                {"Explore My Work   ↓"}
              </a>
              <a
                href="#contact"
                className="inline-flex h-[48px] items-center justify-center border border-border-subtle px-[32px] font-mono text-[13px] leading-[16px] font-semibold tracking-[0.01em] text-text-primary whitespace-pre"
              >
                {"Get in Touch   ->"}
              </a>
            </div>
          </div>

          <div className="border-t border-border-subtle pl-[40px] pr-[65px] pt-[40px] pb-[79px]">
            <p className="font-mono text-[11px] leading-[13px] font-semibold tracking-[0.03em] text-text-secondary">
              DISCIPLINE: BACKEND ARCHITECTURE • SYSTEMS • PEDAGOGY
            </p>
          </div>
        </div>

        {/* Zone 3: Right Engineering Workflow Panel (1fr) */}
        <div className="flex flex-col pl-[60px] pr-[80px] pt-[64px] pb-[79px]">
          <p className="font-mono text-[11px] leading-[13px] font-semibold tracking-[0.02em] text-accent-cobalt">
            FIG. 01 // ENGINEERING MODEL
          </p>
          
          <div className="mt-[32px] border border-border-subtle">
            {/* Panel Header */}
            <div className="h-[48px] flex items-center border-b border-border-subtle px-[24px]">
              <p className="font-mono text-[11px] leading-[13px] font-semibold tracking-[0.02em] text-text-secondary">
                SYSTEMS WORKFLOW // 01 -&gt; 03
              </p>
            </div>

            {/* Node 01 */}
            <div className="px-[32px] pt-[32px] pb-[28px] border-b border-border-subtle">
              <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-accent-cobalt">
                {nodes[0].tag}
              </p>
              <h3 className="mt-[14px] font-sans text-[18px] leading-[22px] font-bold tracking-[-0.01em] text-text-primary">
                {nodes[0].title}
              </h3>
              <p className="mt-[10px] font-sans text-[14px] leading-[22px] font-normal text-text-secondary">
                {nodes[0].description}
              </p>
            </div>

            {/* Connector 01-02 */}
            <div className="flex justify-center">
              <div className="w-[2px] h-[20px] bg-accent-cobalt"></div>
            </div>

            {/* Node 02 - Active/Highlighted */}
            <div className="px-[32px] pt-[28px] pb-[28px] bg-text-primary border-y-2 border-accent-cobalt">
              <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-accent-cobalt">
                {nodes[1].tag}
              </p>
              <h3 className="mt-[14px] font-sans text-[18px] leading-[22px] font-bold tracking-[-0.01em] text-bg-primary">
                {nodes[1].title}
              </h3>
              <p className="mt-[10px] font-sans text-[14px] leading-[22px] font-normal text-bg-primary/70">
                {nodes[1].description}
              </p>
              <p className="mt-[14px] font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt">
                {nodes[1].stack}
              </p>
            </div>

            {/* Connector 02-03 */}
            <div className="flex justify-center">
              <div className="w-[2px] h-[20px] bg-accent-cobalt"></div>
            </div>

            {/* Node 03 */}
            <div className="px-[32px] pt-[28px] pb-[32px] border-b border-border-subtle">
              <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-accent-cobalt">
                {nodes[2].tag}
              </p>
              <h3 className="mt-[14px] font-sans text-[18px] leading-[22px] font-bold tracking-[-0.01em] text-text-primary">
                {nodes[2].title}
              </h3>
              <p className="mt-[10px] font-sans text-[14px] leading-[22px] font-normal text-text-secondary">
                {nodes[2].description}
              </p>
            </div>

            {/* Panel Footer */}
            <div className="h-[40px] flex items-center px-[24px]">
              <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-text-secondary">
                LOOP: INQUIRY -&gt; ARCHITECTURE -&gt; PEDAGOGY
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TABLET HERO (768px: Vertical Top + Horizontal 3-Node Schematic + Bottom 2-Column Split) */}
      <div className="hidden md:block xl:hidden">
        <div className="px-[40px] pt-[32px] pb-[36px] border-b border-border-subtle">
          <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt">
            [ AGUN FIRMANSYAH — PERSONAL PORTFOLIO ]
          </p>
          <h1 className="mt-[24px] font-sans text-[52px] leading-[58px] font-bold tracking-[-0.02em] text-text-primary whitespace-pre-line">
            {profile.tagline}
          </h1>
          <div className="mt-[14px] h-[4px] w-[240px] bg-accent-cobalt"></div>
          <p className="mt-[20px] max-w-[648px] font-sans text-[17px] leading-[27px] font-normal text-text-secondary">
            {profile.bio}
          </p>
          <div className="mt-[28px] flex items-center gap-[16px]">
            <a
              href="#projects"
              className="inline-flex h-[44px] items-center justify-center bg-text-primary px-[28px] font-mono text-[12px] leading-[14px] font-semibold text-bg-primary whitespace-pre"
            >
              {"Explore My Work  ↓"}
            </a>
            <a
              href="#contact"
              className="inline-flex h-[44px] items-center justify-center border border-border-subtle px-[28px] font-mono text-[12px] leading-[14px] font-semibold text-text-primary whitespace-pre"
            >
              {"Get in Touch  ->"}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-border-subtle">
          {nodes.map((node, idx) => (
            <div
              key={idx}
              className={`px-[24px] pt-[28px] pb-[28px] ${
                idx < nodes.length - 1 ? "border-r border-border-subtle" : ""
              }`}
            >
              <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.03em] text-text-secondary">
                {node.tag}
              </p>
              <h3 className="mt-[14px] font-sans text-[16px] leading-[19px] font-bold tracking-[-0.01em] text-text-primary">
                {node.title}
              </h3>
              <p className="mt-[10px] font-sans text-[13px] leading-[21px] font-normal text-text-secondary">
                {node.description}
              </p>
              {node.stack && (
                <p
                  className={`mt-[12px] font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] ${
                    node.highlighted ? "text-accent-cobalt" : "text-text-secondary"
                  }`}
                >
                  {node.stack}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2">
          <div className="border-r border-border-subtle px-[40px] pt-[32px] pb-[36px]">
            <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt">
              [ 01 // IDENTITY ]
            </p>
            <p className="mt-[20px] font-mono text-[10px] leading-[12px] font-normal tracking-[0.02em] text-text-secondary">
              LOCATION / BASE
            </p>
            <p className="mt-[10px] font-sans text-[15px] leading-[18px] font-semibold text-text-primary">
              {profile.location.country}
            </p>
            <p className="mt-[5px] font-mono text-[10px] leading-[12px] font-normal tracking-[0.02em] text-text-secondary">
              {profile.location.code} {" // "} {profile.location.timezone}
            </p>
          </div>

          <div className="flex flex-col justify-between px-[40px] pt-[32px] pb-[36px]">
            <div>
              <p className="font-mono text-[10px] leading-[12px] font-normal tracking-[0.02em] text-text-secondary">
                POSITIONING & ROLES
              </p>
              <ul className="mt-[12px] border-t border-border-subtle">
                {roles.map((role) => (
                  <li
                    key={role.index}
                    className="flex h-[38px] items-center border-b border-border-subtle"
                  >
                    <span
                      className={`w-[12px] font-mono text-[10px] leading-[12px] ${
                        role.primary
                          ? "font-semibold text-accent-cobalt"
                          : "font-normal text-text-secondary"
                      }`}
                    >
                      {role.index}
                    </span>
                    <span
                      className={`ml-[16px] font-sans text-[13px] leading-[16px] text-text-primary ${
                        role.primary ? "font-semibold" : "font-normal"
                      }`}
                    >
                      {role.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-text-secondary">
              BACKEND ARCHITECTURE • SYSTEMS • PEDAGOGY
            </p>
          </div>
        </div>
      </div>

      {/* MOBILE HERO (390px: Single Column Stacked) */}
      <div className="md:hidden">
        <div className="px-[24px] pt-[24px] pb-[28px] border-b border-border-subtle">
          <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-accent-cobalt">
            [ 01 // IDENTITY ]   •   {profile.location.country.toUpperCase()} ({profile.location.timezone})
          </p>
          <h1 className="mt-[18px] font-sans text-[36px] leading-[42px] font-bold tracking-[-0.02em] text-text-primary whitespace-pre-line">
            {profile.tagline}
          </h1>
          <div className="mt-[12px] h-[3px] w-[160px] bg-accent-cobalt"></div>
          <p className="mt-[16px] font-sans text-[15px] leading-[24px] font-normal text-text-secondary">
            {profile.bio}
          </p>
          <div className="mt-[20px] flex flex-col gap-[12px]">
            <a
              href="#projects"
              className="inline-flex h-[40px] items-center justify-center bg-accent-cobalt font-mono text-[11px] leading-[13px] font-semibold text-bg-primary whitespace-pre"
            >
              {"Explore My Work   ↓"}
            </a>
            <a
              href="#contact"
              className="inline-flex h-[40px] items-center justify-center border border-border-subtle font-mono text-[11px] leading-[13px] font-semibold text-text-primary whitespace-pre"
            >
              {"Get in Touch   ->"}
            </a>
          </div>
        </div>

        {/* Roles Box */}
        <div className="px-[24px] pt-[24px] pb-[24px] border-b border-border-subtle bg-bg-surface">
          <p className="font-mono text-[9px] leading-[11px] font-normal tracking-[0.02em] text-text-secondary">
            POSITIONING & ROLES (04)
          </p>
          <ul className="mt-[12px] space-y-[8px]">
            {roles.map((role) => (
              <li key={role.index} className="flex items-start">
                <span className="w-[18px] font-mono text-[9px] leading-[11px] font-normal text-text-secondary">
                  {role.index}
                </span>
                <span className="ml-[8px] font-sans text-[13px] leading-[16px] font-normal text-text-primary">
                  {role.title}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Workflow Schematic */}
        <div className="px-[24px] pt-[24px] pb-[20px] border-b border-border-subtle">
          <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-text-secondary">
            FIG. 01 // ENGINEERING MODEL (01 -&gt; 03)
          </p>
        </div>

        {nodes.map((node, idx) => (
          <div
            key={idx}
            className="px-[24px] pt-[24px] pb-[24px] border-b border-border-subtle"
          >
            <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.03em] text-text-secondary">
              {node.tag}
            </p>
            <h3 className="mt-[12px] font-sans text-[15px] leading-[18px] font-bold tracking-[-0.01em] text-text-primary">
              {node.title}
            </h3>
            <p className="mt-[10px] font-sans text-[13px] leading-[21px] font-normal text-text-secondary">
              {node.description}
            </p>
            {node.stack && (
              <p
                className={`mt-[12px] font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] ${
                  node.highlighted ? "text-accent-cobalt" : "text-text-secondary"
                }`}
              >
                {node.stack}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
