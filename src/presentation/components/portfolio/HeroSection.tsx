import { Fragment } from "react";
import type { HeroProfile } from "../../../domain/entities";
import type { HeroRoleViewModel, EngineeringNodeViewModel } from "../../view-models";

interface HeroSectionProps {
  readonly profile: HeroProfile;
  readonly roles: ReadonlyArray<HeroRoleViewModel>;
  readonly nodes: ReadonlyArray<EngineeringNodeViewModel>;
  readonly sectionIndex?: string;
}

export function HeroSection({ profile, roles, nodes, sectionIndex = "01" }: HeroSectionProps) {
  const roleCount = String(roles.length).padStart(2, "0");
  const nodeCount = String(nodes.length).padStart(2, "0");
  const workflowRange = nodes.length > 0 ? `01 -> ${nodeCount}` : "00";

  return (
    <section
      id="hero"
      aria-label="Identity and Hero"
      className="w-full border-b border-border-subtle bg-bg-primary"
    >
      {/* DESKTOP HERO (1280px+: 3 Asymmetric Zones, centered max-w 1440px) */}
      <div className="hidden xl:block w-full">
        <div className="mx-auto grid w-full max-w-[1440px] xl:min-h-[764px] xl:grid-cols-[minmax(260px,340px)_minmax(440px,560px)_minmax(320px,1fr)] 2xl:grid-cols-[380px_600px_1fr]">
          {/* Zone 1: Left Identity & Roles */}
          <div className="flex min-w-0 flex-col justify-between border-r border-border-subtle xl:pl-[48px] xl:pr-[24px] 2xl:pl-[80px] 2xl:pr-[32px] pt-[52px] 2xl:pt-[64px] pb-[64px] 2xl:pb-[79px]">
            <div>
              <p className="font-mono text-[11px] leading-[13px] font-semibold tracking-[0.02em] text-accent-cobalt">
                {`[ ${sectionIndex} // IDENTITY ]`}
              </p>

              <p className="mt-[39px] font-mono text-[11px] leading-[13px] font-normal tracking-[0.02em] text-text-secondary">
                POSITIONING &amp; ROLES ({roleCount})
              </p>

              <ul className="mt-[13px] w-full max-w-[268px] border-t border-border-subtle">
                {roles.map((role) => (
                  <li
                    key={role.index}
                    className="flex min-h-[44px] items-center border-b border-border-subtle py-[8px] px-1 hover:pl-2.5 hover:bg-white/70 transition-all duration-200 group cursor-default"
                  >
                    <span
                      className={`w-[16px] shrink-0 font-mono text-[11px] leading-[13px] transition-colors duration-200 ${
                        role.primary
                          ? "font-semibold text-accent-cobalt"
                          : "font-normal text-text-secondary group-hover:text-accent-cobalt"
                      }`}
                    >
                      {role.index}
                    </span>
                    <span
                      className={`ml-[16px] min-w-0 font-sans text-[14px] leading-[17px] text-text-primary break-words transition-colors duration-200 ${
                        role.primary ? "font-semibold" : "font-normal group-hover:text-accent-cobalt"
                      }`}
                    >
                      {role.title}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Telemetry Availability Pill */}
              <div className="mt-[24px] inline-flex items-center gap-[8px] px-2.5 py-1 bg-white border border-border-subtle shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-mono text-[9.5px] leading-tight font-semibold text-text-primary tracking-wider uppercase">
                  STATUS // READY FOR WORK
                </span>
              </div>
            </div>

            <div className="mt-[32px]">
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

          {/* Zone 2: Center Main Hero Content */}
          <div className="flex min-w-0 flex-col border-r border-border-subtle">
            <div className="flex-1 xl:px-[32px] 2xl:pl-[40px] 2xl:pr-[65px] pt-[52px] 2xl:pt-[64px] pb-[48px]">
              <p className="font-mono text-[11px] leading-[13px] font-semibold tracking-[0.02em] text-accent-cobalt">
                [ AGUN FIRMANSYAH — PERSONAL PORTFOLIO ]
              </p>
              <h1 className="mt-[46px] font-sans xl:text-[46px] xl:leading-[52px] 2xl:text-[58px] 2xl:leading-[64px] font-bold tracking-[-0.02em] text-text-primary whitespace-pre-line break-words">
                {profile.tagline}
              </h1>
              <div className="mt-[16px] h-[4px] w-full max-w-[280px] bg-accent-cobalt" />
              <p className="mt-[32px] w-full max-w-[480px] font-sans text-[17px] leading-[27px] 2xl:text-[18px] 2xl:leading-[29px] font-normal text-text-secondary">
                {profile.bio}
              </p>
              <div className="mt-[40px] flex flex-wrap items-center gap-[16px] 2xl:gap-[20px]">
                <a
                  href="#projects"
                  className="inline-flex h-[48px] items-center justify-center bg-accent-cobalt hover:bg-accent-cobalt/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 px-[24px] 2xl:px-[32px] font-mono text-[13px] leading-[16px] font-semibold tracking-[0.01em] text-bg-primary whitespace-pre transition-all duration-300"
                >
                  {"Explore My Work   ↓"}
                </a>
                <a
                  href="#contact"
                  className="inline-flex h-[48px] items-center justify-center border border-border-subtle hover:border-accent-cobalt hover:text-accent-cobalt hover:bg-white hover:-translate-y-0.5 active:translate-y-0 px-[24px] 2xl:px-[32px] font-mono text-[13px] leading-[16px] font-semibold tracking-[0.01em] text-text-primary whitespace-pre transition-all duration-300"
                >
                  {"Get in Touch   ->"}
                </a>
              </div>
            </div>

            <div className="border-t border-border-subtle xl:px-[32px] 2xl:pl-[40px] 2xl:pr-[65px] pt-[36px] 2xl:pt-[40px] pb-[64px] 2xl:pb-[79px]">
              <p className="font-mono text-[11px] leading-[13px] font-semibold tracking-[0.03em] text-text-secondary">
                DISCIPLINE: BACKEND ARCHITECTURE • SYSTEMS • PEDAGOGY
              </p>
            </div>
          </div>

          {/* Zone 3: Right Engineering Workflow Panel */}
          <div className="flex min-w-0 flex-col xl:pl-[28px] xl:pr-[48px] 2xl:pl-[60px] 2xl:pr-[80px] pt-[52px] 2xl:pt-[64px] pb-[64px] 2xl:pb-[79px]">
            <p className="font-mono text-[11px] leading-[13px] font-semibold tracking-[0.02em] text-accent-cobalt">
              FIG. 01 // ENGINEERING MODEL
            </p>

            <div className="mt-[32px] border border-border-subtle">
              {/* Panel Header */}
              <div className="flex h-[48px] items-center border-b border-border-subtle px-[20px] 2xl:px-[24px]">
                <p className="font-mono text-[11px] leading-[13px] font-semibold tracking-[0.02em] text-text-secondary">
                  SYSTEMS WORKFLOW // {workflowRange}
                </p>
              </div>

              {/* Dynamic Engineering Nodes */}
              {nodes.map((node, index) => (
                <Fragment key={`${node.tag}-${index}`}>
                  {node.highlighted ? (
                    <div className="bg-text-primary border-y-2 border-accent-cobalt px-[24px] 2xl:px-[32px] py-[28px] hover:shadow-lg transition-all duration-300">
                      <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-accent-cobalt">
                        {node.tag}
                      </p>
                      <h3 className="mt-[14px] font-sans text-[18px] leading-[22px] font-bold tracking-[-0.01em] text-bg-primary break-words">
                        {node.title}
                      </h3>
                      <p className="mt-[10px] font-sans text-[14px] leading-[22px] font-normal text-bg-primary/70 break-words">
                        {node.description}
                      </p>
                      {node.stack && (
                        <p className="mt-[14px] font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt break-words">
                          {node.stack}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="px-[24px] 2xl:px-[32px] pt-[28px] pb-[28px] border-b border-border-subtle hover:bg-white/80 transition-all duration-300">
                      <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.03em] text-accent-cobalt">
                        {node.tag}
                      </p>
                      <h3 className="mt-[14px] font-sans text-[18px] leading-[22px] font-bold tracking-[-0.01em] text-text-primary break-words">
                        {node.title}
                      </h3>
                      <p className="mt-[10px] font-sans text-[14px] leading-[22px] font-normal text-text-secondary break-words">
                        {node.description}
                      </p>
                      {node.stack && (
                        <p className="mt-[14px] font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-text-secondary break-words">
                          {node.stack}
                        </p>
                      )}
                    </div>
                  )}

                  {index < nodes.length - 1 && (
                    <div className="flex justify-center">
                      <div className="w-[2px] h-[20px] bg-accent-cobalt" />
                    </div>
                  )}
                </Fragment>
              ))}

              {/* Panel Footer */}
              <div className="flex min-h-[40px] items-center px-[20px] 2xl:px-[24px] py-[8px]">
                <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-text-secondary">
                  LOOP: INQUIRY -&gt; ARCHITECTURE -&gt; PEDAGOGY
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLET HERO (768px - 1279px) */}
      <div className="hidden md:block xl:hidden mx-auto w-full max-w-[1440px]">
        <div className="border-b border-border-subtle px-[40px] pt-[32px] pb-[36px]">
          <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt">
            [ AGUN FIRMANSYAH — PERSONAL PORTFOLIO ]
          </p>
          <h1 className="mt-[24px] font-sans text-[44px] lg:text-[52px] leading-[50px] lg:leading-[58px] font-bold tracking-[-0.02em] text-text-primary whitespace-pre-line break-words">
            {profile.tagline}
          </h1>
          <div className="mt-[14px] h-[4px] w-full max-w-[240px] bg-accent-cobalt" />
          <p className="mt-[20px] max-w-[648px] font-sans text-[17px] leading-[27px] font-normal text-text-secondary">
            {profile.bio}
          </p>
          <div className="mt-[28px] flex flex-wrap items-center gap-[16px]">
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

        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border-subtle">
          {nodes.map((node, idx) => (
            <div
              key={`${node.tag}-${idx}`}
              className={`min-w-0 px-[24px] pt-[28px] pb-[28px] ${
                idx < nodes.length - 1 ? "border-b md:border-b-0 md:border-r border-border-subtle" : ""
              }`}
            >
              <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.03em] text-text-secondary">
                {node.tag}
              </p>
              <h3 className="mt-[14px] font-sans text-[16px] leading-[19px] font-bold tracking-[-0.01em] text-text-primary break-words">
                {node.title}
              </h3>
              <p className="mt-[10px] font-sans text-[13px] leading-[21px] font-normal text-text-secondary break-words">
                {node.description}
              </p>
              {node.stack && (
                <p
                  className={`mt-[12px] font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] break-words ${
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
          <div className="min-w-0 border-r border-border-subtle px-[40px] pt-[32px] pb-[36px]">
            <p className="font-mono text-[10px] leading-[12px] font-semibold tracking-[0.02em] text-accent-cobalt">
              {`[ ${sectionIndex} // IDENTITY ]`}
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

          <div className="flex min-w-0 flex-col justify-between gap-[24px] px-[40px] pt-[32px] pb-[36px]">
            <div>
              <p className="font-mono text-[10px] leading-[12px] font-normal tracking-[0.02em] text-text-secondary">
                POSITIONING &amp; ROLES ({roleCount})
              </p>
              <ul className="mt-[12px] border-t border-border-subtle">
                {roles.map((role) => (
                  <li
                    key={role.index}
                    className="flex min-h-[38px] items-center border-b border-border-subtle py-[6px]"
                  >
                    <span
                      className={`w-[16px] shrink-0 font-mono text-[10px] leading-[12px] ${
                        role.primary
                          ? "font-semibold text-accent-cobalt"
                          : "font-normal text-text-secondary"
                      }`}
                    >
                      {role.index}
                    </span>
                    <span
                      className={`ml-[12px] min-w-0 font-sans text-[13px] leading-[16px] text-text-primary break-words ${
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

      {/* MOBILE HERO (< 768px: Single Column Stacked) */}
      <div className="md:hidden">
        <div className="border-b border-border-subtle px-[16px] sm:px-[24px] pt-[24px] pb-[28px]">
          <p className="font-mono text-[9px] leading-[13px] font-semibold tracking-[0.02em] text-accent-cobalt break-words">
            {`[ ${sectionIndex} // IDENTITY ] • ${profile.location.country.toUpperCase()} (${profile.location.timezone})`}
          </p>
          <h1 className="mt-[18px] font-sans text-[30px] leading-[36px] sm:text-[36px] sm:leading-[42px] font-bold tracking-[-0.02em] text-text-primary whitespace-pre-line break-words">
            {profile.tagline}
          </h1>
          <div className="mt-[12px] h-[3px] w-full max-w-[160px] bg-accent-cobalt" />
          <p className="mt-[16px] font-sans text-[15px] leading-[24px] font-normal text-text-secondary">
            {profile.bio}
          </p>
          <div className="mt-[20px] flex flex-col sm:flex-row gap-[12px]">
            <a
              href="#projects"
              className="inline-flex h-[40px] sm:flex-1 items-center justify-center bg-accent-cobalt px-[16px] font-mono text-[11px] leading-[13px] font-semibold text-bg-primary whitespace-pre"
            >
              {"Explore My Work   ↓"}
            </a>
            <a
              href="#contact"
              className="inline-flex h-[40px] sm:flex-1 items-center justify-center border border-border-subtle px-[16px] font-mono text-[11px] leading-[13px] font-semibold text-text-primary whitespace-pre"
            >
              {"Get in Touch   ->"}
            </a>
          </div>
        </div>

        {/* Roles Box */}
        <div className="border-b border-border-subtle bg-bg-surface px-[16px] sm:px-[24px] pt-[24px] pb-[24px]">
          <p className="font-mono text-[9px] leading-[11px] font-normal tracking-[0.02em] text-text-secondary">
            POSITIONING &amp; ROLES ({roleCount})
          </p>
          <ul className="mt-[12px] space-y-[8px]">
            {roles.map((role) => (
              <li key={role.index} className="flex items-start">
                <span className="w-[18px] shrink-0 font-mono text-[9px] leading-[13px] font-normal text-text-secondary">
                  {role.index}
                </span>
                <span className="ml-[8px] min-w-0 font-sans text-[13px] leading-[16px] font-normal text-text-primary break-words">
                  {role.title}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Workflow Schematic */}
        <div className="border-b border-border-subtle px-[16px] sm:px-[24px] pt-[24px] pb-[20px]">
          <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] text-text-secondary">
            FIG. 01 // ENGINEERING MODEL ({workflowRange})
          </p>
        </div>

        {nodes.map((node, idx) => (
          <div
            key={`${node.tag}-${idx}`}
            className="border-b border-border-subtle last:border-b-0 px-[16px] sm:px-[24px] pt-[24px] pb-[24px]"
          >
            <p className="font-mono text-[9px] leading-[11px] font-semibold tracking-[0.03em] text-text-secondary">
              {node.tag}
            </p>
            <h3 className="mt-[12px] font-sans text-[15px] leading-[18px] font-bold tracking-[-0.01em] text-text-primary break-words">
              {node.title}
            </h3>
            <p className="mt-[10px] font-sans text-[13px] leading-[21px] font-normal text-text-secondary break-words">
              {node.description}
            </p>
            {node.stack && (
              <p
                className={`mt-[12px] font-mono text-[9px] leading-[11px] font-semibold tracking-[0.02em] break-words ${
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
