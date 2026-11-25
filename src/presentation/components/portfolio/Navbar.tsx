"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { NavLink } from "../../view-models";

interface NavbarProps {
  readonly links: ReadonlyArray<NavLink>;
  readonly brandName: string;
}

export function Navbar({ links, brandName }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Dynamic active section tracking for scrollspy and click interactions
  const [activeHref, setActiveHref] = useState<string>(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      return window.location.hash;
    }
    return links.find((l) => l.active)?.href ?? "";
  });

  const isClickScrollingRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Smoothly navigates to target section with sticky header offset
   * and immediately sets the clicked link as active.
   */
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!href.startsWith("#")) return;

      e.preventDefault();
      setMobileMenuOpen(false);

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      isClickScrollingRef.current = true;

      // Handle brand / top click
      if (href === "#top" || href === "#hero") {
        setActiveHref("");
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.pushState(null, "", window.location.pathname);
        clickTimeoutRef.current = setTimeout(() => {
          isClickScrollingRef.current = false;
        }, 800);
        return;
      }

      const targetId = href.replace("#", "");
      const targetElement = document.getElementById(targetId);

      setActiveHref(href);

      if (targetElement) {
        const headerOffset =
          window.innerWidth >= 1280 ? 76 : window.innerWidth >= 768 ? 68 : 60;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth",
        });

        window.history.pushState(null, "", href);
      } else {
        window.location.hash = href;
      }

      clickTimeoutRef.current = setTimeout(() => {
        isClickScrollingRef.current = false;
      }, 800);
    },
    []
  );

  /**
   * Scrollspy listener to track visible sections and scroll progress.
   */
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 15);

      // Scroll Progress bar
      const winHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (winHeight > 0) {
        const scrolledRatio = Math.min(100, Math.max(0, (currentScroll / winHeight) * 100));
        setScrollProgress(scrolledRatio);
      }

      // Skip scrollspy calculations if user just clicked a nav link and smooth scroll is running
      if (isClickScrollingRef.current) {
        return;
      }

      // 1. If at bottom of page, highlight the last section (e.g. Contact)
      const isAtBottom =
        window.innerHeight + currentScroll >= document.documentElement.scrollHeight - 60;

      if (isAtBottom && links.length > 0) {
        const lastLink = links[links.length - 1];
        if (lastLink) {
          setActiveHref(lastLink.href);
          return;
        }
      }

      // 2. Check if near the top (Hero section area)
      const headerOffset =
        window.innerWidth >= 1280 ? 76 : window.innerWidth >= 768 ? 68 : 60;
      const threshold = headerOffset + 120;

      let matchedHref = "";

      for (const item of links) {
        const id = item.href.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If section top has crossed threshold and bottom is still below threshold
          if (rect.top <= threshold && rect.bottom > threshold) {
            matchedHref = item.href;
            break;
          }
        }
      }

      // Fallback: If between sections, find the closest section whose top is above threshold
      if (!matchedHref && currentScroll > 200) {
        let bestHref = "";
        let bestTop = -Infinity;

        for (const item of links) {
          const id = item.href.replace("#", "");
          const element = document.getElementById(id);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= threshold && rect.top > bestTop) {
              bestTop = rect.top;
              bestHref = item.href;
            }
          }
        }
        if (bestHref) {
          matchedHref = bestHref;
        }
      }

      // If at the very top (Hero section), no section link is active
      if (currentScroll < 150) {
        matchedHref = "";
      }

      setActiveHref(matchedHref);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [links]);

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
            onClick={(e) => handleNavClick(e, "#top")}
            className="flex items-center gap-[8px] xl:gap-[10px] group cursor-pointer"
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
          {links.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <li key={item.index} className="shrink-0">
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="group inline-flex items-baseline whitespace-nowrap py-1 relative cursor-pointer"
                >
                  <span
                    className={`font-sans text-[14px] leading-[17px] transition-colors duration-200 ${
                      isActive
                        ? "font-semibold text-accent-cobalt"
                        : "font-normal text-text-primary group-hover:text-accent-cobalt"
                    }`}
                  >
                    {item.label}
                  </span>
                  {/* Active / Hover Micro Indicator */}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-1 left-0 h-[2px] bg-accent-cobalt transition-all duration-300 ease-out ${
                      isActive
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        {/* Tablet Compact Navigation Links (768px - 1279px) */}
        <ul className="hidden md:flex xl:hidden items-center md:gap-[10px] lg:gap-[20px]">
          {links.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <li key={item.index} className="shrink-0">
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`group font-sans text-[12px] lg:text-[13px] leading-[16px] transition-colors duration-200 whitespace-nowrap relative py-1 cursor-pointer ${
                    isActive
                      ? "font-bold text-accent-cobalt"
                      : "font-semibold text-text-primary hover:text-accent-cobalt"
                  }`}
                >
                  {item.label}
                  {/* Active / Hover Indicator */}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 left-0 h-[2px] bg-accent-cobalt transition-all duration-300 ease-out ${
                      isActive
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        {/* Right Action: Desktop CTA / Tablet CTA / Mobile MENU Toggle */}
        <div className="shrink-0 flex items-center gap-3">
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, "#contact")}
            className="hidden xl:inline-flex h-[40px] w-[144px] items-center justify-center bg-text-primary hover:bg-accent-cobalt font-mono text-[12px] leading-[14px] font-semibold tracking-[0.01em] text-bg-primary hover:shadow-md transition-all duration-300 active:scale-[0.98] whitespace-pre cursor-pointer"
          >
            {"Let's Talk  ->"}
          </a>

          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, "#contact")}
            className="hidden md:inline-flex xl:hidden h-[36px] w-[112px] items-center justify-center bg-text-primary hover:bg-accent-cobalt font-mono text-[11px] leading-[13px] font-semibold text-bg-primary hover:shadow-sm transition-all duration-300 active:scale-[0.98] whitespace-pre cursor-pointer"
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
            {links.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <li key={item.index} className="border-b border-border-subtle">
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`flex h-[44px] items-center justify-between group transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "pl-2.5 bg-accent-cobalt/5 border-l-2 border-accent-cobalt"
                        : "hover:pl-1"
                    }`}
                  >
                    <span
                      className={`font-sans text-[14px] leading-[17px] transition-colors ${
                        isActive
                          ? "font-bold text-accent-cobalt"
                          : "font-normal text-text-primary group-hover:text-accent-cobalt"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`font-mono text-[11px] transition-all ${
                        isActive
                          ? "text-accent-cobalt font-bold translate-x-1"
                          : "text-text-secondary group-hover:translate-x-1 group-hover:text-accent-cobalt"
                      }`}
                    >
                      -&gt;
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>

          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, "#contact")}
            className="mt-[16px] flex h-[44px] w-full items-center justify-center bg-text-primary hover:bg-accent-cobalt font-mono text-[12px] leading-[14px] font-semibold tracking-[0.02em] text-bg-primary hover:shadow-md transition-all duration-300 whitespace-pre cursor-pointer"
          >
            {"Let's Talk  ->"}
          </a>
        </div>
      )}
    </header>
  );
}
