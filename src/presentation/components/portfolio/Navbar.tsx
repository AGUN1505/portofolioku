import type { NavLink } from "../../view-models";

interface NavbarProps {
  readonly links: ReadonlyArray<NavLink>;
  readonly brandName: string;
}

export function Navbar({ links, brandName }: NavbarProps) {
  return (
    <header className="w-full border-b border-border-subtle bg-bg-primary">
      <nav
        aria-label="Primary Navigation"
        className="flex h-[60px] md:h-[68px] xl:h-[76px] w-full items-center justify-between px-[24px] md:px-[40px] xl:px-[80px]"
      >
        {/* Brand Identity */}
        <div className="flex items-center">
          <a
            href="#top"
            className="flex items-center gap-[8px] xl:gap-[10px]"
          >
            <span
              aria-hidden="true"
              className="h-[8px] w-[8px] xl:h-[10px] xl:w-[10px] shrink-0 bg-accent-cobalt"
            />
            <span className="font-sans text-[13px] leading-[16px] md:text-[14px] md:leading-[17px] xl:text-[15px] xl:leading-[18px] font-bold tracking-[0.02em] text-text-primary">
              {brandName}
            </span>
          </a>

          <span
            aria-hidden="true"
            className="hidden xl:block ml-[14px] h-[16px] w-[1px] bg-border-subtle"
          />
          <span className="hidden xl:block ml-[13px] font-mono text-[11px] leading-[13px] font-normal text-text-secondary">
            SYS // BACKEND &amp; EDUCATION
          </span>
        </div>

        {/* Desktop Navigation Links (1440px) */}
        <ul className="hidden xl:flex items-center gap-[47px]">
          {links.map((item) => (
            <li key={item.index}>
              <a
                href={item.href}
                className="group inline-flex items-baseline gap-[9px]"
              >
                <span
                  className={`font-mono text-[11px] leading-[13px] ${
                    item.active
                      ? "font-semibold text-accent-cobalt"
                      : "font-normal text-text-secondary"
                  }`}
                >
                  {item.index}
                </span>
                <span
                  className={`font-sans text-[14px] leading-[17px] text-text-primary ${
                    item.active ? "font-semibold" : "font-normal"
                  }`}
                >
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ul>

        {/* Tablet Compact Navigation Links (768px) */}
        <ul className="hidden md:flex xl:hidden items-center gap-[20px]">
          {links.map((item) => (
            <li key={item.index}>
              <a
                href={item.href}
                className="font-sans text-[13px] leading-[16px] font-semibold text-text-primary"
              >
                {item.index} {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right Action: Desktop CTA / Tablet CTA / Mobile MENU = */}
        <div>
          <a
            href="#contact"
            className="hidden xl:inline-flex h-[40px] w-[144px] items-center justify-center bg-text-primary font-mono text-[12px] leading-[14px] font-semibold tracking-[0.01em] text-bg-primary whitespace-pre"
          >
            {"Let's Talk  ->"}
          </a>

          <a
            href="#contact"
            className="hidden md:inline-flex xl:hidden h-[36px] w-[112px] items-center justify-center bg-text-primary font-mono text-[11px] leading-[13px] font-semibold text-bg-primary whitespace-pre"
          >
            {"Let's Talk ->"}
          </a>

          <a
            href="#about"
            className="inline-flex md:hidden h-[32px] w-[86px] items-center justify-center bg-text-primary font-mono text-[10.5px] leading-[12px] font-semibold text-bg-primary whitespace-pre"
          >
            {"MENU  ="}
          </a>
        </div>
      </nav>
    </header>
  );
}
