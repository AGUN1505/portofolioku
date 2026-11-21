import * as assert from 'node:assert';
import { PortfolioViewMapper } from '../src/presentation/mappers/portfolio-view-mapper';
import {
  HERO_ROLES,
  SCHEMATIC_NODES,
  DEFAULT_CONTACT_CHANNELS,
} from '../src/presentation/data/constants';

console.log('=== TEST SUITE: Stage 10.5 Phase 5.5.3 Task 1 (Constants & Mappers) ===\n');

// --------------------------------------------------------------------------
// 1. DEFAULT_CONTACT_CHANNELS Constant Verification (Authenticity & No Placeholders)
// --------------------------------------------------------------------------
console.log('1. Checking DEFAULT_CONTACT_CHANNELS constant values...');
assert.equal(Array.isArray(DEFAULT_CONTACT_CHANNELS), true, 'Must be an array');

// Must NOT contain any placeholders
for (const channel of DEFAULT_CONTACT_CHANNELS) {
  assert.ok(
    !channel.value.toLowerCase().includes('placeholder'),
    `Channel ${channel.label} must not contain "placeholder" keyword`
  );
  assert.ok(
    !channel.value.includes('[') && !channel.value.includes(']'),
    `Channel ${channel.label} must not contain bracketed placeholder markers`
  );
  assert.ok(
    channel.value.trim().length > 0,
    `Channel ${channel.label} must have a non-empty value`
  );
}
console.log('   ✓ DEFAULT_CONTACT_CHANNELS contains zero placeholders and only authentic data\n');

// --------------------------------------------------------------------------
// 2. toHeroRoleViewModels
// --------------------------------------------------------------------------
console.log('2. Checking PortfolioViewMapper.toHeroRoleViewModels...');

// 2.1 Normal data condition
const normalRoles = [
  { title: 'Software Developer', primary: true },
  { title: 'Backend Engineer', primary: true },
  { title: 'Informatics Engineering Student', primary: false },
];
const mappedNormalRoles = PortfolioViewMapper.toHeroRoleViewModels(normalRoles);
assert.equal(mappedNormalRoles.length, 3);
assert.deepEqual(mappedNormalRoles, [
  { index: '01', title: 'Software Developer', primary: true },
  { index: '02', title: 'Backend Engineer', primary: true },
  { index: '03', title: 'Informatics Engineering Student', primary: false },
]);
console.log('   ✓ Normal roles mapped with 2-digit index and preserved properties');

// 2.2 Empty array fallback condition
const emptyRoles = PortfolioViewMapper.toHeroRoleViewModels([]);
assert.deepEqual(emptyRoles, HERO_ROLES, 'Empty roles array must fall back to HERO_ROLES');
console.log('   ✓ Empty roles array successfully falls back to HERO_ROLES');

// 2.3 Undefined fallback condition
const undefinedRoles = PortfolioViewMapper.toHeroRoleViewModels(undefined);
assert.deepEqual(undefinedRoles, HERO_ROLES, 'Undefined roles must fall back to HERO_ROLES');
console.log('   ✓ Undefined roles parameter successfully falls back to HERO_ROLES\n');

// --------------------------------------------------------------------------
// 3. toEngineeringNodeViewModels
// --------------------------------------------------------------------------
console.log('3. Checking PortfolioViewMapper.toEngineeringNodeViewModels...');

// 3.1 Normal data condition
const normalNodes = [
  {
    tag: '01 / DECONSTRUCT',
    title: 'Understand How Systems Work',
    description: 'Analyze domain requirements.',
    stack: 'GO • POSTGRESQL',
    highlighted: false,
  },
  {
    tag: '02 / ARCHITECT',
    title: 'Design Scalable Microservices',
    description: 'Clean REST API architectures.',
    stack: 'EXPRESS • PRISMA',
    highlighted: true,
  },
];
const mappedNormalNodes = PortfolioViewMapper.toEngineeringNodeViewModels(normalNodes);
assert.equal(mappedNormalNodes.length, 2);
assert.deepEqual(mappedNormalNodes[0], {
  tag: '01 / DECONSTRUCT',
  title: 'Understand How Systems Work',
  description: 'Analyze domain requirements.',
  stack: 'GO • POSTGRESQL',
  highlighted: false,
});
assert.deepEqual(mappedNormalNodes[1], {
  tag: '02 / ARCHITECT',
  title: 'Design Scalable Microservices',
  description: 'Clean REST API architectures.',
  stack: 'EXPRESS • PRISMA',
  highlighted: true,
});
console.log('   ✓ Normal engineering nodes correctly mapped to ViewModels');

// 3.2 Empty array fallback condition
const emptyNodes = PortfolioViewMapper.toEngineeringNodeViewModels([]);
assert.deepEqual(emptyNodes, SCHEMATIC_NODES, 'Empty nodes array must fall back to SCHEMATIC_NODES');
console.log('   ✓ Empty nodes array successfully falls back to SCHEMATIC_NODES');

// 3.3 Undefined fallback condition
const undefinedNodes = PortfolioViewMapper.toEngineeringNodeViewModels(undefined);
assert.deepEqual(undefinedNodes, SCHEMATIC_NODES, 'Undefined nodes must fall back to SCHEMATIC_NODES');
console.log('   ✓ Undefined nodes parameter successfully falls back to SCHEMATIC_NODES\n');

// --------------------------------------------------------------------------
// 4. toContactChannelViewModels (Authentic Channels & Strict Placeholder Filtering)
// --------------------------------------------------------------------------
console.log('4. Checking PortfolioViewMapper.toContactChannelViewModels...');

// 4.1 Normal authentic data condition (CMS populated channels)
const normalChannels = [
  { label: 'EMAIL', value: 'contact@agunfirmansyah.com' },
  { label: 'GITHUB', value: 'https://github.com/agunfirmansyah' },
];
const mappedNormalChannels = PortfolioViewMapper.toContactChannelViewModels(normalChannels);
assert.equal(mappedNormalChannels.length, 2);
assert.equal(mappedNormalChannels[0].index, '01');
assert.equal(mappedNormalChannels[0].label, 'EMAIL');
assert.equal(mappedNormalChannels[0].value, 'contact@agunfirmansyah.com');
assert.equal(mappedNormalChannels[0].desktopWidth, 'w-[580px]');
assert.equal(mappedNormalChannels[1].index, '02');
assert.equal(mappedNormalChannels[1].label, 'GITHUB');
assert.equal(mappedNormalChannels[1].value, 'https://github.com/agunfirmansyah');
assert.equal(mappedNormalChannels[1].desktopWidth, 'w-[580px]');
console.log('   ✓ Authentic channels mapped with sequential presentation configs');

// 4.2 Empty array fallback condition (unseeded 0 records in database)
const emptyChannels = PortfolioViewMapper.toContactChannelViewModels([]);
assert.ok(Array.isArray(emptyChannels), 'Must return an array');
assert.equal(
  emptyChannels.length,
  DEFAULT_CONTACT_CHANNELS.length,
  'Empty channels array must match authentic fallback channels count'
);
assert.equal(
  emptyChannels.some((c) => c.value.toLowerCase().includes('placeholder')),
  false,
  'No placeholder values allowed in public fallback'
);
console.log('   ✓ Empty channels returns authentic fallback without leaking placeholders');

// 4.3 Undefined parameter fallback condition
const undefinedChannels = PortfolioViewMapper.toContactChannelViewModels(undefined);
assert.equal(undefinedChannels.length, DEFAULT_CONTACT_CHANNELS.length);
assert.equal(
  undefinedChannels.some((c) => c.value.toLowerCase().includes('placeholder')),
  false,
  'No placeholder values allowed in undefined fallback'
);
console.log('   ✓ Undefined channels parameter returns authentic fallback safely');

// 4.4 Static repository placeholder filtering
// Simulates when static repository fallback provides placeholder values during DB downtime
const rawStaticPlaceholders = [
  { label: 'EMAIL', value: '[ Email Placeholder — Ready for Official Address ]' },
  { label: 'GITHUB', value: 'GitHub — [ Profile URL Placeholder ]' },
  { label: 'LINKEDIN', value: 'LinkedIn — [ Profile URL Placeholder ]' },
];
const filteredPlaceholders = PortfolioViewMapper.toContactChannelViewModels(rawStaticPlaceholders);
assert.equal(
  filteredPlaceholders.length,
  0,
  'All placeholder channels must be strictly filtered out from public presentation'
);
console.log('   ✓ Raw static placeholders strictly filtered out (0 placeholders passed to view)');

// 4.5 Mixed authentic and placeholder channels
const mixedChannels = [
  { label: 'EMAIL', value: 'verified@agunfirmansyah.com' },
  { label: 'GITHUB', value: '[ Profile URL Placeholder ]' },
  { label: 'TELEGRAM', value: '@agunfirmansyah' },
];
const mappedMixed = PortfolioViewMapper.toContactChannelViewModels(mixedChannels);
assert.equal(mappedMixed.length, 2, 'Only the 2 authentic channels should remain');
assert.equal(mappedMixed[0].index, '01');
assert.equal(mappedMixed[0].label, 'EMAIL');
assert.equal(mappedMixed[0].value, 'verified@agunfirmansyah.com');
assert.equal(mappedMixed[1].index, '02');
assert.equal(mappedMixed[1].label, 'TELEGRAM');
assert.equal(mappedMixed[1].value, '@agunfirmansyah');
console.log('   ✓ Mixed channels correctly filter placeholders and re-index authentic channels sequentially\n');

console.log('=== ALL TASK 1 TESTS PASSED SUCCESSFULLY (100%) ===');
