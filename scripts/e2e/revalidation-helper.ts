// scripts/e2e/revalidation-helper.ts
// AST-based static verification of revalidatePath('/') hooks across all Server Actions.
// Uses TypeScript Compiler API for robust AST traversal, rejecting false positives from strings/comments/error paths.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { strict as assert } from 'node:assert';
import * as ts from 'typescript';

export interface ActionFileSpec {
  file: string;
  expectedActions: string[];
}

export const ADMIN_ACTION_SPECS: ActionFileSpec[] = [
  {
    file: 'app/admin/(dashboard)/hero/actions.ts',
    expectedActions: ['updateHeroProfileAction'],
  },
  {
    file: 'app/admin/(dashboard)/about/actions.ts',
    expectedActions: ['updateAboutProfileAction'],
  },
  {
    file: 'app/admin/(dashboard)/contact/actions.ts',
    expectedActions: ['updateContactProfileAction'],
  },
  {
    file: 'app/admin/(dashboard)/projects/actions.ts',
    expectedActions: [
      'createProjectAction',
      'updateProjectAction',
      'deleteProjectAction',
      'reorderProjectsAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/experiences/actions.ts',
    expectedActions: [
      'createExperienceAction',
      'updateExperienceAction',
      'deleteExperienceAction',
      'reorderExperiencesAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/roles/actions.ts',
    expectedActions: [
      'createRoleAction',
      'updateRoleAction',
      'deleteRoleAction',
      'reorderRolesAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/engineering-nodes/actions.ts',
    expectedActions: [
      'createEngineeringNodeAction',
      'updateEngineeringNodeAction',
      'deleteEngineeringNodeAction',
      'reorderEngineeringNodesAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/domains/actions.ts',
    expectedActions: [
      'createDomainAction',
      'updateDomainAction',
      'deleteDomainAction',
      'reorderDomainsAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/pillars/actions.ts',
    expectedActions: [
      'createPillarAction',
      'updatePillarAction',
      'deletePillarAction',
      'reorderPillarsAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/skills/actions.ts',
    expectedActions: [
      'createSkillCategoryAction',
      'updateSkillCategoryAction',
      'deleteSkillCategoryAction',
      'reorderSkillCategoriesAction',
      'createSkillAction',
      'updateSkillAction',
      'deleteSkillAction',
      'reorderSkillsAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/contact-channels/actions.ts',
    expectedActions: [
      'createContactChannelAction',
      'updateContactChannelAction',
      'deleteContactChannelAction',
      'reorderContactChannelsAction',
    ],
  },
];

/**
 * Checks if a CallExpression matches revalidatePath('/') or revalidatePath("/").
 */
function isRevalidateRootPathCall(node: ts.Node): boolean {
  if (!ts.isCallExpression(node)) return false;

  const expr = node.expression;
  const isRevalidateIdent = ts.isIdentifier(expr) && expr.text === 'revalidatePath';
  if (!isRevalidateIdent) return false;

  if (node.arguments.length < 1) return false;
  const firstArg = node.arguments[0];

  if (ts.isStringLiteral(firstArg) && firstArg.text === '/') {
    return true;
  }

  return false;
}

/**
 * Scans a try-block's statements to ensure revalidatePath('/') is invoked on the success path.
 * Rejects calls located inside catch clauses or error blocks.
 */
function verifySuccessPathRevalidationInTry(tryStmt: ts.TryStatement): boolean {
  let foundInTry = false;

  function visit(node: ts.Node) {
    if (isRevalidateRootPathCall(node)) {
      foundInTry = true;
      return;
    }
    ts.forEachChild(node, visit);
  }

  // Visit only the tryBlock, strictly excluding catchClause
  visit(tryStmt.tryBlock);

  return foundInTry;
}

/**
 * Inspects a function declaration to ensure it invokes revalidatePath('/') on its success path.
 */
function verifyActionHasRootRevalidation(fnDecl: ts.FunctionDeclaration): boolean {
  if (!fnDecl.body) return false;

  let verified = false;

  function visitNode(node: ts.Node) {
    if (ts.isTryStatement(node)) {
      if (verifySuccessPathRevalidationInTry(node)) {
        verified = true;
      }
    }
    ts.forEachChild(node, visitNode);
  }

  visitNode(fnDecl.body);
  return verified;
}

/**
 * Authoritatively verifies via TypeScript AST that all specified Server Actions
 * invoke revalidatePath('/') on their mutation success path.
 */
export function verifyAllActionRevalidationHooks(): { totalFiles: number; totalActions: number } {
  let totalActions = 0;

  for (const spec of ADMIN_ACTION_SPECS) {
    const fullPath = path.resolve(process.cwd(), spec.file);
    assert(fs.existsSync(fullPath), `Action file must exist: ${spec.file}`);

    const sourceCode = fs.readFileSync(fullPath, 'utf8');
    const sourceFile = ts.createSourceFile(
      fullPath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    const exportedActions = new Map<string, ts.FunctionDeclaration>();

    // Collect all exported functions
    sourceFile.forEachChild((node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const isExported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        if (isExported) {
          exportedActions.set(node.name.text, node);
        }
      }
    });

    // Verify each expected action individually
    for (const actionName of spec.expectedActions) {
      const fnDecl = exportedActions.get(actionName);
      assert(fnDecl, `Action '${actionName}' must be exported as a function in ${spec.file}`);

      const hasRevalidation = verifyActionHasRootRevalidation(fnDecl);
      assert(
        hasRevalidation,
        `Action '${actionName}' in ${spec.file} must call revalidatePath('/') on its mutation success path`
      );

      totalActions++;
    }
  }

  return { totalFiles: ADMIN_ACTION_SPECS.length, totalActions };
}
