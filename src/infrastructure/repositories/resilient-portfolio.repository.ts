// src/infrastructure/repositories/resilient-portfolio.repository.ts
import type { IPortfolioRepository } from '../../domain/repositories/portfolio.repository';
import type { Portfolio } from '../../domain/entities';

const RECOGNIZED_CONNECTIVITY_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNRESET',
  'P1001',
  'P1002',
  'P1011',
  'P1017',
  'TlsConnectionError',
]);

const FORBIDDEN_FALLBACK_CODES = new Set([
  'P1000', // Authentication failed (configuration error)
  'P1003', // Database does not exist (configuration error)
  'P2002', // Unique constraint violation (data/business logic error)
  'P2025', // Record not found (query error)
]);

interface ErrorChainNode {
  readonly code?: string;
  readonly errorCode?: string;
  readonly name?: string;
  readonly message?: string;
  readonly isProgrammingError: boolean;
  readonly isValidationError: boolean;
  readonly isMappingError: boolean;
}

function collectErrorChain(root: unknown, maxDepth = 5): ErrorChainNode[] {
  const chain: ErrorChainNode[] = [];
  const visited = new Set<unknown>();
  let current: unknown = root;
  let depth = 0;

  while (current && depth <= maxDepth) {
    if (visited.has(current)) {
      // Circular cause reference detected — terminate traversal safely
      break;
    }
    visited.add(current);

    if (typeof current === 'object' && current !== null) {
      const err = current as {
        code?: unknown;
        errorCode?: unknown;
        name?: unknown;
        message?: unknown;
        cause?: unknown;
      };

      const isProgramming =
        current instanceof TypeError ||
        current instanceof ReferenceError ||
        current instanceof SyntaxError ||
        current instanceof RangeError ||
        current instanceof EvalError ||
        current instanceof URIError;

      const nameStr = typeof err.name === 'string' ? err.name : '';
      const msgStr = typeof err.message === 'string' ? err.message : '';

      const isValidation =
        nameStr === 'ValidationError' ||
        nameStr === 'ZodError' ||
        msgStr.toLowerCase().startsWith('validation error') ||
        msgStr.toLowerCase().includes('invalid project');

      const isMapping =
        nameStr === 'MappingError' ||
        msgStr.toLowerCase().startsWith('mapping error');

      chain.push({
        code: typeof err.code === 'string' ? err.code.trim().toUpperCase() : undefined,
        errorCode: typeof err.errorCode === 'string' ? err.errorCode.trim().toUpperCase() : undefined,
        name: nameStr || undefined,
        message: msgStr || undefined,
        isProgrammingError: isProgramming,
        isValidationError: isValidation,
        isMappingError: isMapping,
      });

      current = err.cause;
      depth++;
    } else {
      break;
    }
  }

  return chain;
}

/**
 * Checks whether an error represents an explicitly recognized database connectivity or availability failure.
 * Configuration errors (e.g., P1000 auth, P1003 missing DB), programming errors,
 * validation errors, and mapping defects are strictly excluded and must be re-thrown.
 */
export function isDatabaseConnectivityError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const chain = collectErrorChain(error);
  if (chain.length === 0) {
    return false;
  }

  // 1. High-priority disqualifier check:
  // If ANY node in the chain is a programming error, validation error, mapping error,
  // or explicit forbidden error code, fallback is strictly forbidden.
  for (const node of chain) {
    if (node.isProgrammingError || node.isValidationError || node.isMappingError) {
      return false;
    }

    if (node.code && FORBIDDEN_FALLBACK_CODES.has(node.code)) {
      return false;
    }

    if (node.errorCode && FORBIDDEN_FALLBACK_CODES.has(node.errorCode)) {
      return false;
    }
  }

  // 2. Recognized connectivity check:
  // Check if any node in the chain has an explicit recognized connectivity code.
  let hasRecognizedConnectivityCode = false;

  for (const node of chain) {
    if (node.code && RECOGNIZED_CONNECTIVITY_CODES.has(node.code)) {
      hasRecognizedConnectivityCode = true;
      break;
    }

    if (node.errorCode && RECOGNIZED_CONNECTIVITY_CODES.has(node.errorCode)) {
      hasRecognizedConnectivityCode = true;
      break;
    }
  }

  return hasRecognizedConnectivityCode;
}

/**
 * Resilient repository decorator.
 * Queries primary (Prisma) repository first. If an explicitly recognized database connectivity
 * failure occurs, it falls back to the static repository. Any other error (configuration, mapping,
 * validation, programming defects) is re-thrown immediately.
 * Guaranteed to return full Portfolio aggregate including certificates: ReadonlyArray<Certificate> and sections: ReadonlyArray<SectionConfig>.
 */
export class ResilientPortfolioRepository implements IPortfolioRepository<Promise<Portfolio>> {
  constructor(
    private readonly primary: IPortfolioRepository<Promise<Portfolio>>,
    private readonly fallback: IPortfolioRepository<Portfolio | Promise<Portfolio>>
  ) {}

  async getPortfolioData(): Promise<Portfolio> {
    try {
      return await this.primary.getPortfolioData();
    } catch (error) {
      if (isDatabaseConnectivityError(error)) {
        // Log sanitized classification only — no credentials, query strings, or sensitive data
        console.warn(
          '[ResilientPortfolioRepository] Primary database connectivity failure detected. Falling back to static repository.'
        );
        return await this.fallback.getPortfolioData();
      }

      // Re-throw programming, configuration, mapping, or unexpected errors unchanged
      throw error;
    }
  }
}
