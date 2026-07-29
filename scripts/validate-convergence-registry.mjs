import fs from 'node:fs';
import path from 'node:path';

const registryPath = path.resolve(
  process.argv[2] || 'docs/convergence/registry.json',
);
const validStatuses = new Set([
  'captured',
  'evaluating',
  'approved',
  'implementing',
  'blocked',
  'verified',
  'archived',
  'rejected',
]);
const validDispositions = new Set([
  'port',
  'reinterpret',
  'archive',
  'reject',
]);
const validPriorities = new Set(['P0', 'P1', 'P2', 'P3']);
const credentialShape = /AIza[0-9A-Za-z_-]{20,}/;

function fail(message) {
  throw new Error(`Convergence registry: ${message}`);
}

function requireText(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} must be text`);
}

function requireTextList(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    fail(`${label} must be ${allowEmpty ? 'an' : 'a non-empty'} array`);
  }
  value.forEach((item, index) => requireText(item, `${label}[${index}]`));
}

function findDependencyCycle(candidatesById) {
  const visiting = new Set();
  const visited = new Set();

  function visit(id, trail) {
    if (visiting.has(id)) return [...trail, id];
    if (visited.has(id)) return null;
    visiting.add(id);

    for (const dependency of candidatesById.get(id).dependencies) {
      const cycle = visit(dependency, [...trail, id]);
      if (cycle) return cycle;
    }

    visiting.delete(id);
    visited.add(id);
    return null;
  }

  for (const id of candidatesById.keys()) {
    const cycle = visit(id, []);
    if (cycle) return cycle;
  }
  return null;
}

if (!fs.existsSync(registryPath)) fail(`missing ${registryPath}`);

let registry;
try {
  registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
} catch (error) {
  fail(`invalid JSON: ${error.message}`);
}

if (registry.schemaVersion !== 1) fail('schemaVersion must be 1');
requireText(registry.updated, 'updated');
requireText(registry.canonical?.product, 'canonical.product');
requireText(registry.canonical?.repository, 'canonical.repository');
requireText(registry.canonical?.branch, 'canonical.branch');
requireText(registry.canonical?.rule, 'canonical.rule');

const activeLimit = registry.workflow?.activeImplementationLimit;
if (!Number.isInteger(activeLimit) || activeLimit < 1) {
  fail('workflow.activeImplementationLimit must be a positive integer');
}
requireTextList(registry.workflow?.states, 'workflow.states');
const configuredStatuses = new Set(registry.workflow.states);
if (
  configuredStatuses.size !== validStatuses.size
  || [...validStatuses].some((status) => !configuredStatuses.has(status))
) {
  fail('workflow.states must contain each supported status exactly once');
}
if (!Array.isArray(registry.candidates) || registry.candidates.length === 0) {
  fail('candidates must be a non-empty array');
}
if (credentialShape.test(JSON.stringify(registry))) {
  fail('credential-shaped value detected');
}

const candidatesById = new Map();
for (const [index, candidate] of registry.candidates.entries()) {
  const label = `candidates[${index}]`;
  requireText(candidate.id, `${label}.id`);
  if (!/^[A-Z]+-\d{3}$/.test(candidate.id)) {
    fail(`${candidate.id} must match AREA-NNN`);
  }
  if (candidatesById.has(candidate.id)) fail(`duplicate id ${candidate.id}`);
  candidatesById.set(candidate.id, candidate);

  requireText(candidate.title, `${candidate.id}.title`);
  requireText(candidate.kind, `${candidate.id}.kind`);
  requireText(candidate.canonicalOwner, `${candidate.id}.canonicalOwner`);
  requireText(candidate.decision, `${candidate.id}.decision`);
  requireText(candidate.rightsRisk, `${candidate.id}.rightsRisk`);
  requireText(candidate.supersededAction, `${candidate.id}.supersededAction`);
  requireText(candidate.nextAction, `${candidate.id}.nextAction`);
  requireTextList(candidate.targetPaths, `${candidate.id}.targetPaths`);
  requireTextList(candidate.dependencies, `${candidate.id}.dependencies`, {
    allowEmpty: true,
  });
  requireTextList(candidate.acceptance, `${candidate.id}.acceptance`);
  requireTextList(candidate.evidence, `${candidate.id}.evidence`, {
    allowEmpty: true,
  });

  if (!validStatuses.has(candidate.status)) {
    fail(`${candidate.id} has unknown status ${candidate.status}`);
  }
  if (!validDispositions.has(candidate.disposition)) {
    fail(`${candidate.id} has unknown disposition ${candidate.disposition}`);
  }
  if (!validPriorities.has(candidate.priority)) {
    fail(`${candidate.id} has unknown priority ${candidate.priority}`);
  }
  if (!Array.isArray(candidate.source) || candidate.source.length === 0) {
    fail(`${candidate.id}.source must be a non-empty array`);
  }
  candidate.source.forEach((source, sourceIndex) => {
    const sourceLabel = `${candidate.id}.source[${sourceIndex}]`;
    requireText(source.repositoryRole, `${sourceLabel}.repositoryRole`);
    requireText(source.revision, `${sourceLabel}.revision`);
    requireTextList(source.paths, `${sourceLabel}.paths`);
  });

  if (candidate.status === 'verified' && candidate.evidence.length === 0) {
    fail(`${candidate.id} is verified without evidence`);
  }
  if (
    ['approved', 'implementing', 'verified'].includes(candidate.status)
    && candidate.acceptance.length < 2
  ) {
    fail(`${candidate.id} needs at least two acceptance criteria`);
  }
}

for (const candidate of registry.candidates) {
  for (const dependency of candidate.dependencies) {
    if (!candidatesById.has(dependency)) {
      fail(`${candidate.id} depends on unknown candidate ${dependency}`);
    }
    if (dependency === candidate.id) fail(`${candidate.id} depends on itself`);
    if (
      ['implementing', 'verified'].includes(candidate.status)
      && candidatesById.get(dependency).status !== 'verified'
    ) {
      fail(
        `${candidate.id} cannot be ${candidate.status} until `
        + `${dependency} is verified`,
      );
    }
  }
}

const cycle = findDependencyCycle(candidatesById);
if (cycle) fail(`dependency cycle: ${cycle.join(' -> ')}`);

const implementing = registry.candidates.filter(
  (candidate) => candidate.status === 'implementing',
);
if (implementing.length > activeLimit) {
  fail(
    `${implementing.length} candidates are implementing; limit is ${activeLimit}`,
  );
}

const counts = Object.fromEntries(
  [...validStatuses].map((status) => [
    status,
    registry.candidates.filter((candidate) => candidate.status === status).length,
  ]),
);
console.log(
  `Convergence registry valid: ${registry.candidates.length} candidates, `
  + `${implementing.length}/${activeLimit} implementing.`,
);
console.log(
  [...validStatuses]
    .filter((status) => counts[status] > 0)
    .map((status) => `${status}=${counts[status]}`)
    .join(' | '),
);
