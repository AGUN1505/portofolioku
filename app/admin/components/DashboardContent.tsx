// app/admin/components/DashboardContent.tsx
// Server Component for CMS Dashboard Hub (Read-Only Portfolio Overview)

import Link from 'next/link';
import { verifySession } from '../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../src/infrastructure/composition-root';
import type { Portfolio } from '../../../src/domain/entities';

interface ModuleInventoryItem {
  readonly name: string;
  readonly section: string;
  readonly href: string;
  readonly modelName: string;
  readonly count: number | string;
  readonly type: 'Singleton' | 'Collection';
  readonly phase: string;
  readonly status: 'Active' | 'Pending';
}

export async function DashboardContent() {
  const session = await verifySession();

  let portfolio: Portfolio | null = null;
  let connectionError: string | null = null;

  try {
    const portfolioUseCase = CompositionRoot.getPortfolioUseCase('prisma');
    portfolio = await portfolioUseCase.execute();
  } catch {
    connectionError = 'Unable to execute read query against PostgreSQL store.';
  }

  const totalSkillsCount = portfolio
    ? portfolio.skills.categories.reduce((sum, cat) => sum + cat.skills.length, 0)
    : 0;

  const MODULES_MATRIX: readonly ModuleInventoryItem[] = [
    {
      name: 'Hero Profile',
      section: 'Hero',
      href: '/admin/hero',
      modelName: 'HeroProfile',
      count: portfolio ? 1 : '—',
      type: 'Singleton',
      phase: 'Phase 3',
      status: 'Pending',
    },
    {
      name: 'Roles',
      section: 'Hero',
      href: '/admin/roles',
      modelName: 'Role',
      count: portfolio ? portfolio.hero.roles.length : '—',
      type: 'Collection',
      phase: 'Phase 5',
      status: 'Pending',
    },
    {
      name: 'Engineering Nodes',
      section: 'Hero',
      href: '/admin/engineering-nodes',
      modelName: 'EngineeringNode',
      count: portfolio ? portfolio.hero.engineeringNodes.length : '—',
      type: 'Collection',
      phase: 'Phase 5',
      status: 'Pending',
    },
    {
      name: 'About Profile',
      section: 'About',
      href: '/admin/about',
      modelName: 'AboutProfile',
      count: portfolio ? 1 : '—',
      type: 'Singleton',
      phase: 'Phase 3',
      status: 'Pending',
    },
    {
      name: 'Domains',
      section: 'About',
      href: '/admin/domains',
      modelName: 'Domain',
      count: portfolio ? portfolio.about.domains.length : '—',
      type: 'Collection',
      phase: 'Phase 5',
      status: 'Pending',
    },
    {
      name: 'Pillars',
      section: 'About',
      href: '/admin/pillars',
      modelName: 'Pillar',
      count: portfolio ? portfolio.about.pillars.length : '—',
      type: 'Collection',
      phase: 'Phase 5',
      status: 'Pending',
    },
    {
      name: 'Projects',
      section: 'Work & History',
      href: '/admin/projects',
      modelName: 'Project',
      count: portfolio ? portfolio.projects.length : '—',
      type: 'Collection',
      phase: 'Phase 4',
      status: 'Pending',
    },
    {
      name: 'Experiences',
      section: 'Work & History',
      href: '/admin/experiences',
      modelName: 'Experience',
      count: portfolio ? portfolio.experiences.length : '—',
      type: 'Collection',
      phase: 'Phase 4',
      status: 'Pending',
    },
    {
      name: 'Skills & Taxonomy',
      section: 'Capabilities',
      href: '/admin/skills',
      modelName: 'SkillCategory / Skill',
      count: portfolio ? `${totalSkillsCount} (${portfolio.skills.categories.length} cats)` : '—',
      type: 'Collection',
      phase: 'Phase 5',
      status: 'Pending',
    },
    {
      name: 'Contact Profile',
      section: 'Contact',
      href: '/admin/contact',
      modelName: 'ContactProfile',
      count: portfolio ? 1 : '—',
      type: 'Singleton',
      phase: 'Phase 3',
      status: 'Pending',
    },
    {
      name: 'Contact Channels',
      section: 'Contact',
      href: '/admin/contact-channels',
      modelName: 'ContactChannel',
      count: portfolio ? portfolio.contact.channels.length : '—',
      type: 'Collection',
      phase: 'Phase 6',
      status: 'Pending',
    },
    {
      name: 'Account Settings',
      section: 'System',
      href: '/admin/account',
      modelName: 'Admin',
      count: '1 Account',
      type: 'Singleton',
      phase: 'Phase 6',
      status: 'Pending',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)]">
        <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
          Stage 10.4 • Phase 2
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
          Dashboard Hub
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
          Centralized administrative management hub. Operational status, PostgreSQL store metrics, and modular section directory.
        </p>
      </header>

      {/* Database Connection & Security Status */}
      <section className="bg-white border border-[var(--border-subtle)] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
            System & Database Environment
          </h2>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            Read-Only Audit Mode
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-[var(--bg-surface)]/60 border border-[var(--border-subtle)]">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase">Target Database</p>
            <p className="font-semibold text-[var(--text-primary)] mt-1">porto_cms</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">PostgreSQL 14.5 (Laragon)</p>
          </div>

          <div className="p-3 bg-[var(--bg-surface)]/60 border border-[var(--border-subtle)]">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase">Connection State</p>
            {connectionError ? (
              <p className="font-semibold text-red-700 mt-1">Read Query Failed</p>
            ) : (
              <p className="font-semibold text-green-700 mt-1">Live Read Verified</p>
            )}
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">PrismaPortfolioRepository</p>
          </div>

          <div className="p-3 bg-[var(--bg-surface)]/60 border border-[var(--border-subtle)]">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase">Admin Identity</p>
            <p className="font-semibold text-[var(--text-primary)] mt-1">{session.username}</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">DAL Auth Layer 3 Passed</p>
          </div>

          <div className="p-3 bg-[var(--bg-surface)]/60 border border-[var(--border-subtle)]">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase">Session Version</p>
            <p className="font-semibold text-[var(--text-primary)] mt-1">v{session.sessionVersion}</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Atomic Revocation Guard</p>
          </div>
        </div>

        {connectionError && (
          <div className="p-3 border border-red-200 bg-red-50 text-red-900 text-xs font-mono">
            {connectionError}
          </div>
        )}
      </section>

      {/* Portfolio Content Inventory Metrics */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
          Portfolio Content Inventory
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-white border border-[var(--border-subtle)]">
            <p className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">Projects</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {portfolio ? portfolio.projects.length : '—'}
            </p>
            <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">Case Studies</p>
          </div>

          <div className="p-4 bg-white border border-[var(--border-subtle)]">
            <p className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">Experiences</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {portfolio ? portfolio.experiences.length : '—'}
            </p>
            <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">Timeline Entries</p>
          </div>

          <div className="p-4 bg-white border border-[var(--border-subtle)]">
            <p className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">Skills</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {totalSkillsCount}
            </p>
            <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">
              {portfolio ? `${portfolio.skills.categories.length} Categories` : '—'}
            </p>
          </div>

          <div className="p-4 bg-white border border-[var(--border-subtle)]">
            <p className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">Hero Focus</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {portfolio ? portfolio.hero.roles.length + portfolio.hero.engineeringNodes.length : '—'}
            </p>
            <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">Roles & Nodes</p>
          </div>

          <div className="p-4 bg-white border border-[var(--border-subtle)]">
            <p className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">About Pillars</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {portfolio ? portfolio.about.domains.length + portfolio.about.pillars.length : '—'}
            </p>
            <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">Domains & Pillars</p>
          </div>

          <div className="p-4 bg-white border border-[var(--border-subtle)]">
            <p className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">Channels</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {portfolio ? portfolio.contact.channels.length : '—'}
            </p>
            <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">0 Configured</p>
          </div>
        </div>
      </section>

      {/* 13 Dedicated Modules Directory Matrix */}
      <section className="bg-white border border-[var(--border-subtle)] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Modular Section Directory (1 Page = 1 Section)
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              13 dedicated administrative views segregated by domain responsibility.
            </p>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            13 Modules Wired
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[10px] uppercase text-[var(--text-secondary)] bg-[var(--bg-surface)]/50">
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Prisma Model</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Records</th>
                <th className="py-2.5 px-3">Roadmap</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]/60">
              {MODULES_MATRIX.map((item) => (
                <tr key={item.name} className="hover:bg-[var(--bg-surface)]/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                    {item.section}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)] text-[11px]">
                    {item.modelName}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                    {item.type}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-primary)] font-semibold">
                    {item.count}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {item.phase}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      href={item.href}
                      className="text-xs text-[var(--accent-cobalt)] hover:underline inline-flex items-center space-x-1"
                    >
                      <span>View</span>
                      <span>→</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Safety Notice Strip */}
      <footer className="p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p>
          Stage 10.4 Phase 2 Guardrail: Database mutations and CRUD forms are disabled on all modules until their respective implementation phases.
        </p>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-[var(--accent-cobalt)] hover:underline whitespace-nowrap"
        >
          View Public Portfolio ↗
        </Link>
      </footer>
    </div>
  );
}
