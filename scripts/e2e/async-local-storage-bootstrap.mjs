// scripts/e2e/async-local-storage-bootstrap.mjs
// Pre-flight bootstrap to bind AsyncLocalStorage to globalThis BEFORE Next.js internals load.
// Strictly isolated to Node.js async_hooks runtime initialization.

import { AsyncLocalStorage } from 'node:async_hooks';

// 1. Authoritatively bind AsyncLocalStorage to globalThis before any Next.js module evaluates
if (typeof globalThis.AsyncLocalStorage === 'undefined') {
  globalThis.AsyncLocalStorage = AsyncLocalStorage;
}

// 2. Dynamically import the E2E runner module
// Dynamic import guarantees that globalThis.AsyncLocalStorage is bound before e2e-runner.ts
// and its entire dependency tree (including test-cases.ts and Next.js async storage) are evaluated.
try {
  const runner = await import('./e2e-runner.ts');
  if (typeof runner.main === 'function') {
    await runner.main();
  } else {
    throw new Error('[E2E-BOOTSTRAP-FATAL] runner.main is not a function in ./e2e-runner.ts');
  }
} catch (err) {
  if (err instanceof Error) {
    console.error('\n❌ [E2E-BOOTSTRAP-ERROR] Runner execution failed:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
  } else {
    console.error('\n❌ [E2E-BOOTSTRAP-ERROR] Runner execution failed with non-Error value:', String(err));
  }
  process.exitCode = 1;
}
