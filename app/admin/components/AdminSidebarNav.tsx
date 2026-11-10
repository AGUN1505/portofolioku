'use client';

// app/admin/components/AdminSidebarNav.tsx
// Navigation structure for Swiss Admin Shell (13 Dedicated Pages)

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly badge?: string;
}

interface NavSection {
  readonly sectionTitle: string;
  readonly items: readonly NavItem[];
}

const NAVIGATION_SECTIONS: readonly NavSection[] = [
  {
    sectionTitle: 'Core',
    items: [
      { label: 'Dashboard', href: '/admin' },
    ],
  },
  {
    sectionTitle: 'Hero Section',
    items: [
      { label: 'Hero Profile', href: '/admin/hero' },
      { label: 'Roles', href: '/admin/roles' },
      { label: 'Engineering Nodes', href: '/admin/engineering-nodes' },
    ],
  },
  {
    sectionTitle: 'About Section',
    items: [
      { label: 'About Profile', href: '/admin/about' },
      { label: 'Domains', href: '/admin/domains' },
      { label: 'Pillars', href: '/admin/pillars' },
    ],
  },
  {
    sectionTitle: 'Work & History',
    items: [
      { label: 'Projects', href: '/admin/projects' },
      { label: 'Experiences', href: '/admin/experiences' },
    ],
  },
  {
    sectionTitle: 'Capabilities',
    items: [
      { label: 'Skills & Taxonomy', href: '/admin/skills' },
    ],
  },
  {
    sectionTitle: 'Contact',
    items: [
      { label: 'Contact Profile', href: '/admin/contact' },
      { label: 'Contact Channels', href: '/admin/contact-channels' },
    ],
  },
  {
    sectionTitle: 'System',
    items: [
      { label: 'Account Settings', href: '/admin/account' },
    ],
  },
];

interface AdminSidebarNavProps {
  readonly onNavigate?: () => void;
}

export function AdminSidebarNav({ onNavigate }: AdminSidebarNavProps) {
  const pathname = usePathname();

  const isItemActive = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
      {NAVIGATION_SECTIONS.map((section) => (
        <div key={section.sectionTitle} className="space-y-1">
          <p className="px-3 pb-1 text-[10px] uppercase font-mono tracking-widest text-[var(--text-secondary)]">
            {section.sectionTitle}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isItemActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center justify-between px-3 py-2 transition-colors rounded-none ${
                      active
                        ? 'border-l-2 border-[var(--accent-cobalt)] bg-white text-[var(--text-primary)] font-semibold shadow-xs'
                        : 'border-l-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#EAE7E0]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
