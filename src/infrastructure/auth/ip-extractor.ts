// src/infrastructure/auth/ip-extractor.ts
// Secure client IP extraction respecting TRUSTED_PROXIES

export function extractClientIPFromHeaders(headers: { get(name: string): string | null }): string | undefined {
  const trustedProxies = (process.env.TRUSTED_PROXIES || '').trim().toLowerCase();

  // If no trusted proxy is configured, DO NOT trust forwarded headers.
  // In a direct connection, client controls X-Forwarded-For and can spoof any IP to bypass rate limits.
  if (!trustedProxies) {
    return undefined;
  }

  // Case 1: Vercel production deployment
  if (trustedProxies === 'vercel' || process.env.VERCEL === '1') {
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
      const clientIp = forwarded.split(',')[0].trim();
      return normalizeIP(clientIp);
    }
    const realIp = headers.get('x-real-ip');
    if (realIp) return normalizeIP(realIp.trim());
  }

  // Case 2: Cloudflare proxy
  if (trustedProxies === 'cloudflare') {
    const cfIp = headers.get('cf-connecting-ip');
    if (cfIp) return normalizeIP(cfIp.trim());

    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
      const clientIp = forwarded.split(',')[0].trim();
      return normalizeIP(clientIp);
    }
  }

  // Case 3: Comma-separated list of explicit proxy identifiers
  if (trustedProxies) {
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
      const clientIp = forwarded.split(',')[0].trim();
      return normalizeIP(clientIp);
    }
  }

  return undefined;
}

/**
 * Normalizes IP address representation (IPv4/IPv6).
 */
export function normalizeIP(ip: string): string {
  const trimmed = ip.trim();
  // Strip IPv6-mapped IPv4 prefix (e.g. ::ffff:127.0.0.1)
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.substring(7);
  }
  return trimmed;
}

/**
 * Gets client IP from Next.js request headers asynchronously.
 */
export async function getClientIP(): Promise<string | undefined> {
  try {
    const { headers } = await import('next/headers');
    const headerList = await headers();
    return extractClientIPFromHeaders(headerList);
  } catch {
    return undefined;
  }
}
