import test from 'node:test';
import assert from 'node:assert/strict';
import { auditHostProduction } from '../scripts/audit-host-production.mjs';

test('canonical host production looks have valid local PNG artwork', async () => {
  const result = await auditHostProduction();

  assert.equal(result.packId, 'xander-surf-v1');
  assert.equal(result.lookCount, 12);
  assert.equal(result.assetCount, 12);
  assert.deepEqual(result.provenance, { sourceCount: 5, outputCount: 12 });
  assert.deepEqual(result.failures, []);
});
