// app/admin/login/actions.ts
// Server Actions for administrator login and logout

'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { extractClientIPFromHeaders } from '../../../src/infrastructure/auth/ip-extractor';
import { createSessionCookie, readSessionCookie, clearSessionCookie } from '../../../src/infrastructure/auth/session';
import { CompositionRoot } from '../../../src/infrastructure/composition-root';

export interface AuthActionState {
  success: boolean;
  error?: string;
  statusCode?: number;
  retryAfterMs?: number;
}

/**
 * Server Action for administrator login.
 * Validates credentials, checks rate limits, creates encrypted session cookie.
 */
export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = (formData.get('email') as string) || (formData.get('username') as string) || '';
  const password = (formData.get('password') as string) || '';

  // Extract client IP safely (respecting TRUSTED_PROXIES)
  const headerList = await headers();
  const clientIP = extractClientIPFromHeaders(headerList);

  const loginUseCase = CompositionRoot.getLoginAdminUseCase();
  const result = await loginUseCase.execute({
    email,
    password,
    clientIP,
  });

  if (!result.success || !result.admin || result.sessionVersion === undefined) {
    return {
      success: false,
      error: result.error ?? 'Invalid email or password',
      statusCode: result.statusCode ?? 401,
      retryAfterMs: result.retryAfterMs,
    };
  }

  // Create encrypted Iron Session cookie (regenerated on successful login)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await createSessionCookie({
    userId: result.admin.id,
    username: result.admin.username,
    sessionVersion: result.sessionVersion,
    expiresAt,
  });

  // Redirect to admin landing area
  redirect('/admin');
}

/**
 * Server Action for administrator logout.
 * Increments DB sessionVersion for active admin (revoking all sessions) and deletes cookie.
 */
export async function logoutAction(): Promise<void> {
  // Read existing session to obtain authenticated admin ID
  const session = await readSessionCookie();

  if (session?.userId) {
    const logoutUseCase = CompositionRoot.getLogoutAdminUseCase();
    await logoutUseCase.execute({ userId: session.userId });
  }

  // Clear session cookie
  await clearSessionCookie();

  // Redirect to login page
  redirect('/admin/login');
}
