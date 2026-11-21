// app/admin/(dashboard)/account/AccountSettingsClient.tsx
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateAdminProfileAction,
  changeAdminPasswordAction,
  type AccountFormState,
} from './actions';
import type { AdminAccountSnapshot } from '../../../../src/application/use-cases/account/get-admin-account.use-case';
import type { VerifiedSession } from '../../../../src/infrastructure/auth/dal';

interface AccountSettingsClientProps {
  readonly account: AdminAccountSnapshot | null;
  readonly fallbackSession: VerifiedSession;
}

const initialState: AccountFormState = {
  success: false,
};

export function AccountSettingsClient({ account, fallbackSession }: AccountSettingsClientProps) {
  const router = useRouter();
  const [profileState, profileFormAction, isProfilePending] = useActionState(
    updateAdminProfileAction,
    initialState
  );
  const [passwordState, passwordFormAction, isPasswordPending] = useActionState(
    changeAdminPasswordAction,
    initialState
  );

  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (profileState.success || passwordState.success) {
      router.refresh();
    }
  }, [profileState.success, profileState.timestamp, passwordState.success, passwordState.timestamp, router]);

  const adminId = account?.admin.id ?? fallbackSession.userId;
  const username = account?.admin.username ?? fallbackSession.username;
  const email = account?.admin.email ?? '';
  const sessionVersion = account?.sessionVersion ?? fallbackSession.sessionVersion;
  const updatedAt = account?.admin.updatedAt
    ? new Date(account.admin.updatedAt).toLocaleString()
    : 'Unavailable';

  return (
    <div className="space-y-8">
      {/* Section 1: Account Metadata & Single-Admin Policy Summary */}
      <section className="bg-white border border-[var(--border-subtle)] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
            Account Metadata &amp; Single-Admin Policy
          </h2>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-[#EBF7EE] border border-[#A5D6A7] text-[#1B5E20]">
            Single-Admin Guard Enforced
          </span>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-[var(--bg-surface)]/60 border border-[var(--border-subtle)]">
            <dt className="text-[10px] text-[var(--text-secondary)] uppercase">Account ID</dt>
            <dd className="font-semibold text-[var(--text-primary)] mt-1 break-all">{adminId}</dd>
          </div>
          <div className="p-3 bg-[var(--bg-surface)]/60 border border-[var(--border-subtle)]">
            <dt className="text-[10px] text-[var(--text-secondary)] uppercase">Username</dt>
            <dd className="font-semibold text-[var(--text-primary)] mt-1">{username}</dd>
          </div>
          <div className="p-3 bg-[var(--bg-surface)]/60 border border-[var(--border-subtle)]">
            <dt className="text-[10px] text-[var(--text-secondary)] uppercase">
              Active Session Version
            </dt>
            <dd className="font-semibold text-[var(--accent-cobalt)] mt-1">v{sessionVersion}</dd>
          </div>
          <div className="p-3 bg-[var(--bg-surface)]/60 border border-[var(--border-subtle)]">
            <dt className="text-[10px] text-[var(--text-secondary)] uppercase">Last Modified</dt>
            <dd className="font-semibold text-[var(--text-primary)] mt-1">{updatedAt}</dd>
          </div>
        </dl>
      </section>

      {/* Section 2: Profile & Identity Form */}
      <section className="bg-white border border-[var(--border-subtle)] p-6 space-y-5">
        <div className="pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
            Profile &amp; Identity Settings
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Update administrator username and optional recovery email. Current password confirmation is required.
          </p>
        </div>

        {profileState.success && profileState.message && (
          <div
            role="status"
            className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono"
          >
            <span className="font-bold mr-2">SUCCESS:</span>
            {profileState.message}
          </div>
        )}

        {profileState.error && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-300 text-red-900 text-xs font-mono"
          >
            <span className="font-bold mr-2">ERROR:</span>
            {profileState.error}
          </div>
        )}

        <form action={profileFormAction} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label
                htmlFor="account-username"
                className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
              >
                Username <span className="text-[var(--accent-cobalt)]">*</span>
              </label>
              <input
                id="account-username"
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={30}
                defaultValue={username}
                disabled={isProfilePending}
                className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
              />
              {profileState.errors?.username && (
                <p className="text-[11px] font-mono text-red-600 mt-1">
                  {profileState.errors.username}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="account-email"
                className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
              >
                Email Address (Optional)
              </label>
              <input
                id="account-email"
                name="email"
                type="email"
                maxLength={254}
                defaultValue={email}
                placeholder="admin@example.com"
                disabled={isProfilePending}
                className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
              />
              {profileState.errors?.email && (
                <p className="text-[11px] font-mono text-red-600 mt-1">
                  {profileState.errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 max-w-md">
            <label
              htmlFor="profile-current-password"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
            >
              Current Password Confirmation <span className="text-[var(--accent-cobalt)]">*</span>
            </label>
            <input
              id="profile-current-password"
              name="currentPassword"
              type={showPasswords ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={isProfilePending}
              className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
            />
            {profileState.errors?.currentPassword && (
              <p className="text-[11px] font-mono text-red-600 mt-1">
                {profileState.errors.currentPassword}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              Target: Admin ({adminId})
            </span>
            <button
              type="submit"
              disabled={isProfilePending}
              className="px-6 py-2.5 bg-[var(--text-primary)] text-white hover:bg-[var(--accent-cobalt)] text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isProfilePending ? 'Updating Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* Section 3: Password Rotation & Session Revocation Form */}
      <section className="bg-white border border-[var(--border-subtle)] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Password Rotation &amp; Atomic Session Revocation
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Changing your password atomically increments <code className="font-mono">sessionVersion</code> to invalidate all sessions on other devices.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords((prev) => !prev)}
            className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-4"
          >
            {showPasswords ? '[Hide Passwords]' : '[Show Passwords]'}
          </button>
        </div>

        <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] space-y-1">
          <p className="font-semibold text-[var(--text-primary)] uppercase">
            Strict Password Policy:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Minimum 12 characters long</li>
            <li>At least one uppercase letter, one lowercase letter, and one numeric digit</li>
            <li>Must not contain your username ({username}) and must differ from current password</li>
          </ul>
        </div>

        {passwordState.success && passwordState.message && (
          <div
            role="status"
            className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono"
          >
            <span className="font-bold mr-2">SUCCESS:</span>
            {passwordState.message}
          </div>
        )}

        {passwordState.error && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-300 text-red-900 text-xs font-mono"
          >
            <span className="font-bold mr-2">ERROR:</span>
            {passwordState.error}
          </div>
        )}

        <form action={passwordFormAction} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label
                htmlFor="password-current"
                className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
              >
                Current Password <span className="text-[var(--accent-cobalt)]">*</span>
              </label>
              <input
                id="password-current"
                name="currentPassword"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isPasswordPending}
                className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
              />
              {passwordState.errors?.currentPassword && (
                <p className="text-[11px] font-mono text-red-600 mt-1">
                  {passwordState.errors.currentPassword}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password-new"
                className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
              >
                New Password <span className="text-[var(--accent-cobalt)]">*</span>
              </label>
              <input
                id="password-new"
                name="newPassword"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={12}
                disabled={isPasswordPending}
                className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
              />
              {passwordState.errors?.newPassword && (
                <p className="text-[11px] font-mono text-red-600 mt-1">
                  {passwordState.errors.newPassword}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password-confirm"
                className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
              >
                Confirm New Password <span className="text-[var(--accent-cobalt)]">*</span>
              </label>
              <input
                id="password-confirm"
                name="confirmPassword"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={12}
                disabled={isPasswordPending}
                className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
              />
              {passwordState.errors?.confirmPassword && (
                <p className="text-[11px] font-mono text-red-600 mt-1">
                  {passwordState.errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              Current Session Version: v{sessionVersion} → Next: v{sessionVersion + 1}
            </span>
            <button
              type="submit"
              disabled={isPasswordPending}
              className="px-6 py-2.5 bg-[var(--text-primary)] text-white hover:bg-[var(--accent-cobalt)] text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPasswordPending ? 'Rotating Password...' : 'Change Password & Revoke Sessions'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
