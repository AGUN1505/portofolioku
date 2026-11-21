// src/presentation/utils/section-order.ts
// Utility for determining active landing page section order and dynamic navbar links.

import type { NavLink } from "../view-models";

export const DEFAULT_SECTION_ORDER = [
  "hero",
  "about",
  "projects",
  "experience",
  "skills",
  "certificates",
  "contact",
] as const;

export interface SectionNavMeta {
  readonly label: string;
  readonly href: string;
}

export const SECTION_NAV_METADATA: Record<string, SectionNavMeta> = {
  about: { label: "About", href: "#about" },
  projects: { label: "Projects", href: "#projects" },
  experience: { label: "Experience", href: "#experience" },
  skills: { label: "Capabilities", href: "#skills" },
  certificates: { label: "Certificates", href: "#certificates" },
  contact: { label: "Contact", href: "#contact" },
};

export function resolveOrderedSectionKeys(
  sections?: ReadonlyArray<{ key: string; order: number; enabled?: boolean }> | null
): string[] {
  if (!sections || sections.length === 0) {
    return [...DEFAULT_SECTION_ORDER];
  }

  return [...sections]
    .filter((section) => section.enabled !== false)
    .sort((a, b) => a.order - b.order)
    .map((section) => section.key);
}

export function resolveOrderedNavLinks(
  sections?: ReadonlyArray<{ key: string; order: number; enabled?: boolean }> | null
): NavLink[] {
  const activeKeys = resolveOrderedSectionKeys(sections);
  const navKeys = activeKeys.filter((key) => key !== "hero" && key in SECTION_NAV_METADATA);

  return navKeys.map((key, index) => {
    const meta = SECTION_NAV_METADATA[key];
    const indexStr = String(index + 1).padStart(2, "0");
    return {
      index: indexStr,
      label: meta.label,
      href: meta.href,
      active: index === 0,
    };
  });
}

