'use client';

// app/admin/components/AdminShell.tsx
// Master Swiss Admin Shell with accessible mobile drawer (focus trap, restoration, and scroll lock)

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AdminSidebarNav } from './AdminSidebarNav';
import { AdminTopbar } from './AdminTopbar';

interface AdminShellProps {
  readonly userSection: ReactNode;
  readonly children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AdminShell({ userSection, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const wasMobileOpenRef = useRef(false);

  // Auto-close mobile drawer when navigating to a new route (adjusting state during render per React 19 guidelines)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Focus trap, focus restoration, Escape key handling, and background scroll lock
  useEffect(() => {
    if (mobileOpen) {
      wasMobileOpenRef.current = true;

      // 1. Lock background scrolling
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // 2. Initial focus: focus close button inside drawer once mounted
      const initialFocusTimer = window.setTimeout(() => {
        if (closeBtnRef.current) {
          closeBtnRef.current.focus();
        } else if (drawerRef.current) {
          const firstFocusable = drawerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
          firstFocusable?.focus();
        }
      }, 30);

      // 3. Focus trap and Escape listener
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setMobileOpen(false);
          return;
        }

        if (e.key === 'Tab' && drawerRef.current) {
          const focusables = Array.from(
            drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
          ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);

          if (focusables.length === 0) {
            e.preventDefault();
            return;
          }

          const firstEl = focusables[0];
          const lastEl = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstEl || !drawerRef.current.contains(document.activeElement)) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl || !drawerRef.current.contains(document.activeElement)) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.clearTimeout(initialFocusTimer);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    } else if (wasMobileOpenRef.current) {
      // Restore focus to hamburger trigger when drawer closes
      wasMobileOpenRef.current = false;
      if (hamburgerRef.current && document.contains(hamburgerRef.current)) {
        hamburgerRef.current.focus();
      }
    }
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* ─── DESKTOP FIXED SIDEBAR (lg and up) ─── */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex-col z-30">
        {/* Branding Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <Link href="/admin" className="block">
            <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
              Personal Portfolio
            </p>
            <h1 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
              PORTO CMS
            </h1>
          </Link>
          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
            <span>Admin Shell</span>
            <span className="px-1.5 py-0.2 bg-white border border-[var(--border-subtle)]">
              Stage 10.4
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <AdminSidebarNav />

        {/* Authenticated User Session & Sign Out */}
        {userSection}
      </aside>

      {/* ─── MOBILE DRAWER (Below lg) ─── */}
      {mobileOpen && (
        <div
          id="admin-mobile-drawer"
          className="lg:hidden fixed inset-0 z-40 flex"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
            className="relative flex-1 flex flex-col max-w-xs w-full bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] shadow-xl z-50"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
                  Portfolio CMS
                </p>
                <p className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                  PORTO ADMIN
                </p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Close navigation drawer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation List with Auto-Close on Navigate */}
            <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />

            {/* User Session */}
            {userSection}
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT VIEWPORT ─── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminTopbar
          onToggleMobileNav={() => setMobileOpen((prev) => !prev)}
          mobileOpen={mobileOpen}
          hamburgerRef={hamburgerRef}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>

        {/* Minimal Swiss Footer Strip */}
        <footer className="border-t border-[var(--border-subtle)] px-4 sm:px-6 py-3 text-center text-[10px] font-mono text-[var(--text-secondary)]">
          Porto CMS v1.0 • Clean Architecture + PostgreSQL 14.5 • Stage 10.4 Phase 2.1
        </footer>
      </div>
    </div>
  );
}
