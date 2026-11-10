'use client';

// app/admin/components/AdminTopbar.tsx
// Topbar with dynamic Swiss breadcrumbs, mobile toggle, and truthful database environment identity

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { RefObject } from 'react';

interface BreadcrumbSegment {
  readonly label: string;
  readonly href?: string;
}

function getBreadcrumbs(pathname: string): readonly BreadcrumbSegment[] {
  if (pathname === '/admin') {
    return [{ label: 'Dashboard' }];
  }

  const base: BreadcrumbSegment[] = [{ label: 'Dashboard', href: '/admin' }];

  if (pathname.startsWith('/admin/hero')) {
    return [...base, { label: 'Hero Section' }, { label: 'Hero Profile' }];
  }
  if (pathname.startsWith('/admin/roles')) {
    return [...base, { label: 'Hero Section' }, { label: 'Roles' }];
  }
  if (pathname.startsWith('/admin/engineering-nodes')) {
    return [...base, { label: 'Hero Section' }, { label: 'Engineering Nodes' }];
  }
  if (pathname.startsWith('/admin/about')) {
    return [...base, { label: 'About Section' }, { label: 'About Profile' }];
  }
  if (pathname.startsWith('/admin/domains')) {
    return [...base, { label: 'About Section' }, { label: 'Domains' }];
  }
  if (pathname.startsWith('/admin/pillars')) {
    return [...base, { label: 'About Section' }, { label: 'Pillars' }];
  }
  if (pathname === '/admin/projects/new') {
    return [...base, { label: 'Work & History' }, { label: 'Projects', href: '/admin/projects' }, { label: 'New Project' }];
  }
  if (pathname.startsWith('/admin/projects/') && pathname !== '/admin/projects') {
    return [...base, { label: 'Work & History' }, { label: 'Projects', href: '/admin/projects' }, { label: 'Edit Project' }];
  }
  if (pathname.startsWith('/admin/projects')) {
    return [...base, { label: 'Work & History' }, { label: 'Projects' }];
  }
  if (pathname.startsWith('/admin/experiences')) {
    return [...base, { label: 'Work & History' }, { label: 'Experiences' }];
  }
  if (pathname.startsWith('/admin/skills')) {
    return [...base, { label: 'Capabilities' }, { label: 'Skills & Taxonomy' }];
  }
  if (pathname.startsWith('/admin/contact-channels')) {
    return [...base, { label: 'Contact' }, { label: 'Contact Channels' }];
  }
  if (pathname.startsWith('/admin/contact')) {
    return [...base, { label: 'Contact' }, { label: 'Contact Profile' }];
  }
  if (pathname.startsWith('/admin/account')) {
    return [...base, { label: 'System' }, { label: 'Account Settings' }];
  }

  return [...base, { label: 'Module' }];
}

interface AdminTopbarProps {
  readonly onToggleMobileNav: () => void;
  readonly mobileOpen?: boolean;
  readonly hamburgerRef?: RefObject<HTMLButtonElement | null>;
}

export function AdminTopbar({
  onToggleMobileNav,
  mobileOpen = false,
  hamburgerRef,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-20 h-14 bg-[var(--bg-primary)]/90 backdrop-blur-xs border-b border-[var(--border-subtle)] flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Toggle */}
        <button
          ref={hamburgerRef}
          type="button"
          onClick={onToggleMobileNav}
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-drawer"
          aria-label={mobileOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
          className="lg:hidden p-1.5 border border-[var(--border-subtle)] bg-white text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumb Hierarchy */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs font-mono">
          {breadcrumbs.map((segment, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={`${segment.label}-${index}`} className="flex items-center space-x-1.5">
                {index > 0 && <span className="text-[var(--text-secondary)]">/</span>}
                {segment.href && !isLast ? (
                  <Link
                    href={segment.href}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline-offset-2 hover:underline"
                  >
                    {segment.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'}>
                    {segment.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right Environment Indicator & Public Link */}
      <div className="flex items-center space-x-3 text-xs font-mono">
        <div
          title="Authoritative PostgreSQL Database Environment: porto_cms"
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-[var(--border-subtle)] text-[var(--text-secondary)]"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-cobalt)]" />
          <span className="text-[11px]">porto_cms</span>
        </div>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--accent-cobalt)] hover:underline flex items-center space-x-1"
        >
          <span>View Site</span>
          <span className="text-[10px]">↗</span>
        </Link>
      </div>
    </header>
  );
}
