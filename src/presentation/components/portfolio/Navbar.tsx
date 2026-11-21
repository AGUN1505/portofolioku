"use client";

import { useState, useEffect } from "react";
import type { NavLink } from "../../view-models";

interface NavbarProps {
  readonly links: ReadonlyArray<NavLink>;
  readonly brandName: string;
}

export function Navbar({ links, brandName }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 15);

      const winHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (winHeight > 0) {
        const scrolledRatio = Math.min(100, Math.max(0, (currentScroll / winHeight) * 100));
        setScrollProgress(scrolledRatio);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled
          ? "glass-header-scrolled border-border-subtle/80"
          : "bg-bg-primary border-border-subtle"
      }`}
    >
      {/* Scroll Progress Indicator Bar */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Page reading progress"
        className="absolute top-0 left-0 h-[2.5px] bg-accent-cobalt z-50 pointer-events-none transition-[width] duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      <nav
        aria-label="Primary Navigation"
        className="mx-auto flex h-[60px] md:h-[68px] xl:h-[76px] w-full max-w-[1440px] items-center justify-between gap-[16px] px-[16px] sm:px-[24px] md:px-[40px] xl:px-[48px] 2xl:px-[80px]"
      >
        {/* Brand Identity */}
        <div className="flex min-w-0 shrink-0 items-center">
          <a
            href="#top"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-[8px] xl:gap-[10px] group"
          >
            <span
              aria-hidden="true"
              className="h-[8px] w-[8px] xl:h-[10px] xl:w-[10px] shrink-0 bg-accent-cobalt transition-transform duration-300 group-hover:scale-125"
            />
            <span className="font-sans text-[13px] leading-[16px] md:text-[14px] md:leading-[17px] xl:text-[15px] xl:leading-[18px] font-bold tracking-[0.02em] text-text-primary whitespace-nowrap group-hover:text-accent-cobalt transition-colors duration-200">
              {brandName}
            </span>
          </a>

          <span
            aria-hidden="true"
            className="hidden xl:block ml-[14px] h-[16px] w-[1px] bg-border-subtle"
          />
          <span className="hidden xl:block ml-[13px] font-mono text-[11px] leading-[13px] font-normal text-text-secondary whitespace-nowrap">
            SYS // BACKEND &amp; EDUCATION
          </span>
        </div>

        {/* Desktop Navigation Links (1280px+) */}
        <ul className="hidden xl:flex items-center xl:gap-[20px] 2xl:gap-[36px]">
          {links.map((item) => (
            <li key={item.index} className="shrink-0">
              <a
                href={item.href}
                className="group inline-flex items-baseline gap-[9px] whitespace-nowrap py-1 relative"
              >
                <span
                  className={`font-mono text-[11px] leading-[13px] transition-colors duration-200 ${
                    item.active
                      ? "font-semibold text-accent-cobalt"
                      : "font-normal text-text-secondary group-hover:text-accent-cobalt"
                  }`}
                >
                  {item.index}
                </span>
                <span
                  className={`font-sans text-[14px] leading-[17px] transition-colors duration-200 ${
                    item.active
                      ? "font-semibold text-text-primary"
                      : "font-normal text-text-primary group-hover:text-accent-cobalt"
                  }`}
                >
                  {item.label}
                </span>
                {/* Active / Hover Micro Indicator */}
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-1 left-0 h-[2px] bg-accent-cobalt transition-all duration-300 ease-out ${
                    item.active
                      ? "w-full opacity-100"
                      : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                  }`}
                />
              </a>
            </li>
          ))}
        </ul>

        {/* Tablet Compact Navigation Links (768px - 1279px) */}
        <ul className="hidden md:flex xl:hidden items-center md:gap-[10px] lg:gap-[20px]">
          {links.map((item) => (
            <li key={item.index} className="shrink-0">
              <a
                href={item.href}
                className="group font-sans text-[12px] lg:text-[13px] leading-[16px] font-semibold text-text-primary hover:text-accent-cobalt transition-colors duration-200 whitespace-nowrap"
              >
                <span className="text-text-secondary group-hover:text-accent-cobalt font-mono text-[11px] mr-1">
                  {item.index}
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right Action: Desktop CTA / Tablet CTA / Mobile MENU Toggle */}
        <div className="shrink-0 flex items-center gap-3">
          <a
            href="#contact"
            className="hidden xl:inline-flex h-[40px] w-[144px] items-center justify-center bg-text-primary hover:bg-accent-cobalt font-mono text-[12px] leading-[14px] font-semibold tracking-[0.01em] text-bg-primary hover:shadow-md transition-all duration-300 active:scale-[0.98] whitespace-pre"
          >
            {"Let's Talk  ->"}
          </a>

          <a
            href="#contact"
            className="hidden md:inline-flex xl:hidden h-[36px] w-[112px] items-center justify-center bg-text-primary hover:bg-accent-cobalt font-mono text-[11px] leading-[13px] font-semibold text-bg-primary hover:shadow-sm transition-all duration-300 active:scale-[0.98] whitespace-pre"
          >
            {"Let's Talk ->"}
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex md:hidden h-[32px] w-[86px] items-center justify-center bg-text-primary hover:bg-accent-cobalt font-mono text-[10.5px] leading-[12px] font-semibold text-bg-primary transition-colors duration-200 whitespace-pre cursor-pointer"
          >
            {mobileMenuOpen ? "CLOSE  ×" : "MENU  ="}
          </button>
        </div>
      </nav>

      {/* Mobile Collapsible Navigation Drawer (< 768px) */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="md:hidden border-t border-border-subtle bg-bg-primary/95 backdrop-blur-md px-[16px] sm:px-[24px] py-[20px] transition-all animate-fadeIn"
        >
          <ul className="space-y-[4px] border-t border-border-subtle">
            {links.map((item) => (
              <li key={item.index} className="border-b border-border-subtle">
                <a
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-[44px] items-center justify-between group hover:pl-1 transition-all duration-200"
                >
                  <span className="flex items-center gap-[12px]">
                    <span
                      className={`font-mono text-[11px] leading-[13px] transition-colors ${
                        item.active
                          ? "font-semibold text-accent-cobalt"
                          : "font-normal text-text-secondary group-hover:text-accent-cobalt"
                      }`}
                    >
                      {item.index}
                    </span>
                    <span
                      className={`font-sans text-[14px] leading-[17px] transition-colors ${
                        item.active
                          ? "font-semibold text-text-primary"
                          : "font-normal text-text-primary group-hover:text-accent-cobalt"
                      }`}
                    >
                      {item.label}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-text-secondary group-hover:translate-x-1 group-hover:text-accent-cobalt transition-all">
                    -&gt;
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-[16px] flex h-[44px] w-full items-center justify-center bg-text-primary hover:bg-accent-cobalt font-mono text-[12px] leading-[14px] font-semibold tracking-[0.02em] text-bg-primary hover:shadow-md transition-all duration-300 whitespace-pre"
          >
            {"Let's Talk  ->"}
          </a>
        </div>
      )}
    </header>
  );
}

