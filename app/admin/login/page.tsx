// app/admin/login/page.tsx
// Administrator Login Page (Swiss International Style Editorial Design)

'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { loginAction, type AuthActionState } from './actions';

const initialState: AuthActionState = {
  success: false,
};

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-full max-w-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 sm:p-10">
        <header className="border-b border-[var(--border-subtle)] pb-6 mb-6">
          <span className="block text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">
            Restricted System
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mt-2">
            CMS Authentication
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            Enter administrative credentials to access the portfolio content management system.
          </p>
        </header>

        {state?.error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 p-3.5 border border-red-300 bg-red-50/80 text-red-800 text-xs font-mono leading-relaxed"
          >
            <span className="font-semibold block mb-0.5">Authentication Failed</span>
            {state.error}
            {state.retryAfterMs && state.retryAfterMs > 0 && (
              <span className="block mt-1 text-[11px] text-red-600">
                Cooldown window active. Retry in {Math.ceil(state.retryAfterMs / 1000)}s.
              </span>
            )}
          </div>
        )}

        <form action={formAction} className="space-y-5" noValidate={false}>
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-2"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
              disabled={isPending}
              aria-required="true"
              aria-invalid={Boolean(state?.error)}
              className="w-full bg-[#fcfbf9] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-cobalt)] focus:ring-1 focus:ring-[var(--accent-cobalt)] transition-colors disabled:opacity-60 font-sans"
              placeholder="e.g. admin"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none focus:underline underline-offset-4"
              >
                {showPassword ? '[Hide]' : '[Show]'}
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isPending}
                aria-required="true"
                aria-invalid={Boolean(state?.error)}
                className="w-full bg-[#fcfbf9] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-cobalt)] focus:ring-1 focus:ring-[var(--accent-cobalt)] transition-colors disabled:opacity-60 font-mono tracking-tight"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[var(--accent-cobalt)] hover:bg-[#1b3bb8] text-white text-xs font-mono uppercase tracking-widest py-3 px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--accent-cobalt)] focus:ring-offset-2"
            >
              {isPending ? 'Verifying Credentials...' : 'Sign In'}
            </button>
          </div>
        </form>

        <footer className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
          <Link
            href="/"
            className="hover:text-[var(--text-primary)] underline underline-offset-4 transition-colors"
          >
            ← Public Portfolio
          </Link>
          <span className="text-[10px] text-[var(--text-secondary)]/80">
            Porto CMS v0.1
          </span>
        </footer>
      </div>
    </main>
  );
}
