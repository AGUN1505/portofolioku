import * as fs from 'node:fs';
import * as path from 'node:path';
import * as assert from 'node:assert';

interface ActionSpec {
  file: string;
  category: 'newly-updated' | 'previously-existing' | 'phase6-channels';
  expectedActions: string[];
}

const ACTION_SPECS: ActionSpec[] = [
  // 11 Newly Updated Actions
  {
    file: 'app/admin/(dashboard)/hero/actions.ts',
    category: 'newly-updated',
    expectedActions: ['updateHeroProfileAction'],
  },
  {
    file: 'app/admin/(dashboard)/about/actions.ts',
    category: 'newly-updated',
    expectedActions: ['updateAboutProfileAction'],
  },
  {
    file: 'app/admin/(dashboard)/contact/actions.ts',
    category: 'newly-updated',
    expectedActions: ['updateContactProfileAction'],
  },
  {
    file: 'app/admin/(dashboard)/projects/actions.ts',
    category: 'newly-updated',
    expectedActions: [
      'createProjectAction',
      'updateProjectAction',
      'deleteProjectAction',
      'reorderProjectsAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/experiences/actions.ts',
    category: 'newly-updated',
    expectedActions: [
      'createExperienceAction',
      'updateExperienceAction',
      'deleteExperienceAction',
      'reorderExperiencesAction',
    ],
  },
  // Previously Existing Actions with Public Revalidation
  {
    file: 'app/admin/(dashboard)/roles/actions.ts',
    category: 'previously-existing',
    expectedActions: [
      'createRoleAction',
      'updateRoleAction',
      'deleteRoleAction',
      'reorderRolesAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/engineering-nodes/actions.ts',
    category: 'previously-existing',
    expectedActions: [
      'createEngineeringNodeAction',
      'updateEngineeringNodeAction',
      'deleteEngineeringNodeAction',
      'reorderEngineeringNodesAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/domains/actions.ts',
    category: 'previously-existing',
    expectedActions: [
      'createDomainAction',
      'updateDomainAction',
      'deleteDomainAction',
      'reorderDomainsAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/pillars/actions.ts',
    category: 'previously-existing',
    expectedActions: [
      'createPillarAction',
      'updatePillarAction',
      'deletePillarAction',
      'reorderPillarsAction',
    ],
  },
  {
    file: 'app/admin/(dashboard)/skills/actions.ts',
    category: 'previously-existing',
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
  // Phase 6 Contact Channels Actions with Public Revalidation
  {
    file: 'app/admin/(dashboard)/contact-channels/actions.ts',
    category: 'phase6-channels',
    expectedActions: [
      'createContactChannelAction',
      'updateContactChannelAction',
      'deleteContactChannelAction',
      'reorderContactChannelsAction',
    ],
  },
];

function extractFunctionBody(fileContent: string, functionName: string): string {
  const marker = `export async function ${functionName}`;
  const startIndex = fileContent.indexOf(marker);
  if (startIndex === -1) {
    throw new Error(`Function ${functionName} not found in source file`);
  }

  // Find the opening brace of the function body
  const openBraceIndex = fileContent.indexOf('{', startIndex);
  if (openBraceIndex === -1) {
    throw new Error(`Opening brace not found for function ${functionName}`);
  }

  // Bracket counting to extract exact function body
  let depth = 0;
  let endIndex = -1;
  for (let i = openBraceIndex; i < fileContent.length; i++) {
    const char = fileContent[i];
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    throw new Error(`Closing brace not found for function ${functionName}`);
  }

  return fileContent.slice(openBraceIndex, endIndex + 1);
}

function verifyAction(filePath: string, functionName: string, category: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const body = extractFunctionBody(content, functionName);

  // 1. Must contain revalidatePath('/') or revalidatePath("/")
  const hasPublicRevalidation =
    body.includes("revalidatePath('/')") || body.includes('revalidatePath("/")');
  assert.ok(
    hasPublicRevalidation,
    `[${category}] ${functionName} in ${filePath} does NOT call revalidatePath('/')!`
  );

  // 2. Must contain success return: success: true
  const successIndex = body.indexOf('success: true');
  assert.ok(
    successIndex !== -1,
    `[${category}] ${functionName} in ${filePath} does not contain a success: true return payload`
  );

  // 3. revalidatePath('/') must be called on the success path
  const revalIndex = body.lastIndexOf("revalidatePath('/')");
  const revalIndexDouble = body.lastIndexOf('revalidatePath("/")');
  const effectiveRevalIndex = Math.max(revalIndex, revalIndexDouble);

  assert.ok(
    effectiveRevalIndex < successIndex,
    `[${category}] ${functionName} in ${filePath}: revalidatePath('/') must precede 'success: true'`
  );

  // 4. Must preserve admin revalidations
  const hasAdminRevalidation = body.includes("revalidatePath('/admin");
  assert.ok(
    hasAdminRevalidation,
    `[${category}] ${functionName} in ${filePath}: admin revalidation was removed!`
  );
}

async function runAudit(): Promise<void> {
  console.log('=== TEST SUITE: Phase 5.5.4 Cache Revalidation Verification ===\n');

  let newlyUpdatedCount = 0;
  let previouslyExistingCount = 0;
  let phase6Count = 0;
  let totalActionsCount = 0;

  for (const spec of ACTION_SPECS) {
    const fullPath = path.resolve(process.cwd(), spec.file);
    assert.ok(fs.existsSync(fullPath), `File not found: ${spec.file}`);

    console.log(`Auditing: ${spec.file} (${spec.category})`);

    for (const actionName of spec.expectedActions) {
      verifyAction(fullPath, actionName, spec.category);
      totalActionsCount++;
      if (spec.category === 'newly-updated') {
        newlyUpdatedCount++;
      } else if (spec.category === 'previously-existing') {
        previouslyExistingCount++;
      } else {
        phase6Count++;
      }
      console.log(`  ✓ ${actionName} calls revalidatePath('/') on success path`);
    }
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(`Newly updated actions verified: ${newlyUpdatedCount}/11`);
  console.log(`Previously existing actions verified: ${previouslyExistingCount}/24`);
  console.log(`Phase 6 contact channels actions verified: ${phase6Count}/4`);
  console.log(`Total portfolio mutation actions verified: ${totalActionsCount}/${ACTION_SPECS.reduce((acc, s) => acc + s.expectedActions.length, 0)}`);

  assert.strictEqual(newlyUpdatedCount, 11, 'Expected exactly 11 newly updated actions');
  assert.ok(previouslyExistingCount >= 22, 'Expected at least 22 previously existing actions');
  assert.strictEqual(phase6Count, 4, 'Expected exactly 4 Phase 6 contact channels actions');
  assert.ok(totalActionsCount >= 39, 'Expected at least 39 total portfolio mutation actions');

  console.log('\n=== ALL PORTFOLIO MUTATION ACTIONS VERIFIED SUCCESSFULLY (100%) ===');
}

runAudit().catch((err) => {
  console.error('\n❌ REVALIDATION VERIFICATION FAILED:', err);
  process.exit(1);
});
