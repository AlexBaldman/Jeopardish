import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { verifyVisualContract } from '../scripts/verify-visual-contract.mjs';

const contract = JSON.parse(readFileSync(new URL('../contracts/visual-cabinet.v1.json', import.meta.url), 'utf8'));
const makeRows = () => contract.viewports.flatMap(vp => contract.themes.flatMap(theme => contract.states.map(state => ({
  id: `${vp.id}-${theme}-${state}`, viewport: { width: vp.width, height: vp.height },
  fixture: state, theme, failures: [], geometry: { cabinet: { width: 500, height: 500 } },
}))));
const screenshot = () => Buffer.alloc(200, 1);

test('accepts exactly 210 checked cases and screenshots', () => {
  const result = verifyVisualContract(contract, makeRows(), screenshot);
  assert.equal(result.status, 'pass');
  assert.equal(result.expectedCases, 210);
  assert.equal(result.observedCases, 210);
  assert.equal(result.verifiedScreenshots, 210);
  assert.match(result.screenshotManifestSha256, /^[0-9a-f]{64}$/);
});

test('isolates geometry failure to its original fixture', () => {
  const rows = makeRows();
  rows[3].failures.push('host overlaps clue text');
  const result = verifyVisualContract(contract, rows, screenshot);
  assert.equal(result.status, 'fail');
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].id, rows[3].id);
  assert.match(result.failures[0].findings[0], /host overlaps/);
});

test('rejects missing and duplicated fixtures', () => {
  const rows = makeRows(); rows.pop();
  assert.equal(verifyVisualContract(contract, rows, screenshot).status, 'fail');
  rows.push(rows[0]);
  assert.ok(verifyVisualContract(contract, rows, screenshot).failures.some(f => f.findings.includes('Duplicate fixture result')));
});

test('requires readable screenshots even when geometry passes', () => {
  const result = verifyVisualContract(contract, makeRows(), name => {
    if (name === 'desktop-light-clue.png') throw new Error('ENOENT');
    return screenshot();
  });
  assert.equal(result.status, 'fail');
  assert.equal(result.verifiedScreenshots, 209);
  assert.ok(result.failures.some(f => f.id === 'desktop-light-clue'));
});

test('detects incorrect state labels and viewport geometry', () => {
  const rows = makeRows(); rows[0].fixture = 'menu'; rows[1].viewport.width = 7;
  assert.equal(verifyVisualContract(contract, rows, screenshot).failures.length, 2);
});

test('rejects unsafe fixture naming and unexpected execution authority', () => {
  const bad = structuredClone(contract); bad.viewports[0].id = '../private';
  assert.throws(() => verifyVisualContract(bad, [], screenshot), /Invalid verify-only/);
  bad.viewports[0].id = 'phone-320'; bad.authority = 'execute-deploy';
  assert.throws(() => verifyVisualContract(bad, [], screenshot), /Invalid verify-only/);
});

test('never certifies missing or malformed geometry', () => {
  assert.equal(verifyVisualContract(contract, null, screenshot).status, 'fail');
  assert.equal(verifyVisualContract(contract, {}, screenshot).status, 'fail');
});
