// scripts/bootstrap-admin.ts
// Interactive Administrator Bootstrap CLI (Single-Admin Architecture)
// DO NOT RUN DIRECTLY IN AUTOMATED PHASES — THIS IS A MANUAL PROVISIONING UTILITY.

import * as readline from 'node:readline';
import { CompositionRoot } from '../src/infrastructure/composition-root';
import { BootstrapAdminUseCase } from '../src/application/use-cases/auth/bootstrap-admin.use-case';

/**
 * Prompts user for standard line input.
 */
export function promptQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Prompts user for secure masked password input via raw terminal mode.
 * Keystrokes are masked with '*' and never stored or echoed to stdout in plaintext.
 */
export function promptMaskedPassword(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    process.stdout.write(query);
    const stdin = process.stdin;

    if (!stdin.isTTY || !stdin.setRawMode) {
      return reject(new Error('Secure TTY required for interactive password masking.'));
    }

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    const onData = (char: string) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // EOF
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          process.stdout.write('\n[ABORTED] Operation cancelled by user.\n');
          process.exit(130);
          break;
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    };

    stdin.on('data', onData);
  });
}

/**
 * Main bootstrap orchestrator.
 */
export async function runBootstrapAdmin(): Promise<void> {
  console.log('================================================================');
  console.log(' PORTO CMS: INITIAL ADMINISTRATOR BOOTSTRAP UTILITY');
  console.log(' Single-Admin Architecture / Layer 5 Infrastructure');
  console.log('================================================================');

  // 1. Enforce single-admin policy: check existing admin count
  const adminRepo = CompositionRoot.getAdminRepository();
  const existingCount = await adminRepo.count();

  if (existingCount > 0) {
    console.error(
      `\n[ERROR] Single-admin policy violation: ${existingCount} admin account(s) already exist.`
    );
    console.error('Bootstrap operation aborted to prevent account proliferation.\n');
    process.exit(1);
  }

  // 2. Collect admin username
  const rawUsername = await promptQuestion('Admin Username: ');
  if (!rawUsername) {
    console.error('\n[ERROR] Username is required.\n');
    process.exit(1);
  }

  const normalizedUsername = rawUsername.toLowerCase().trim();

  // 3. Collect optional email
  const rawEmail = await promptQuestion('Admin Email (optional, press Enter to skip): ');
  const email = rawEmail ? rawEmail.toLowerCase().trim() : undefined;

  // 4. Collect and confirm masked master password
  const password = await promptMaskedPassword('Master Password: ');
  const passwordConfirm = await promptMaskedPassword('Confirm Master Password: ');

  if (password !== passwordConfirm) {
    console.error('\n[ERROR] Password confirmation does not match.\n');
    process.exit(1);
  }

  // Pre-validate password policy before hitting service
  const policyCheck = BootstrapAdminUseCase.validatePasswordPolicy(password, normalizedUsername);
  if (!policyCheck.valid) {
    console.error(`\n[ERROR] Password policy violation: ${policyCheck.error}\n`);
    process.exit(1);
  }

  // 5. Execute Bootstrap Use Case
  try {
    const bootstrapUseCase = CompositionRoot.getBootstrapAdminUseCase();
    const result = await bootstrapUseCase.execute({
      username: normalizedUsername,
      password,
      email,
    });

    if (!result.success || !result.admin) {
      console.error(`\n[ERROR] Bootstrap execution failed: ${result.error}\n`);
      process.exit(1);
    }

    console.log('\n[SUCCESS] Administrator account successfully created.');
    console.log(`  Admin ID:  ${result.admin.id}`);
    console.log(`  Username:  ${result.admin.username}`);
    if (result.admin.email) {
      console.log(`  Email:     ${result.admin.email}`);
    }
    console.log(`  Created:   ${result.admin.createdAt.toISOString()}`);
    console.log('\n[SECURITY NOTE] Credentials are encrypted with bcrypt (12 rounds). Zero plaintext logged.\n');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n[FATAL] Database persistence error: ${message}\n`);
    process.exit(1);
  }
}

// Auto-run guard: only runs when executed directly via CLI, never when imported in tests
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('scripts/bootstrap-admin.ts')
) {
  runBootstrapAdmin().catch((err) => {
    console.error('[UNEXPECTED ERROR]', err);
    process.exit(1);
  });
}
