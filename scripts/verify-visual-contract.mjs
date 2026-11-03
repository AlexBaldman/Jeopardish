import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const safe = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,39}$/.test(value);

export function verifyVisualContract(contract, rows, readScreenshot) {
  if (contract?.schemaVersion !== 1 || contract?.id !== 'jeopardish.visual-cabinet'
    || contract?.authority !== 'verify-only'
    || !Array.isArray(contract?.states) || !Array.isArray(contract?.themes)
    || !Array.isArray(contract?.viewports)
    || !contract.states.length || !contract.themes.length || !contract.viewports.length
    || ![...contract.states, ...contract.themes, ...contract.viewports.map(v => v.id)].every(safe)
    || contract.viewports.some(v => !Number.isInteger(v.width) || !Number.isInteger(v.height) || v.width < 200 || v.height < 200)
    || new Set(contract.states).size !== contract.states.length
    || new Set(contract.themes).size !== contract.themes.length
    || new Set(contract.viewports.map(v => v.id)).size !== contract.viewports.length
    || contract.expectedCaseCount !== contract.states.length * contract.themes.length * contract.viewports.length
    || contract.expectedCaseCount !== 210) {
    throw new Error('Invalid verify-only visual contract');
  }
  const expected = new Map();
  for (const vp of contract.viewports) for (const theme of contract.themes) for (const state of contract.states) {
    expected.set(`${vp.id}-${theme}-${state}`, { vp, theme, state });
  }
  const failures = [], seen = new Set(), artifacts = [];
  let screenshots = 0;
  if (!Array.isArray(rows)) {
    failures.push({ id: 'geometry.json', findings: ['Missing or invalid geometry report'] });
    rows = [];
  }
  for (const row of rows) {
    const id = row?.id;
    if (!expected.has(id) || seen.has(id)) {
      failures.push({ id: String(id), findings: [seen.has(id) ? 'Duplicate fixture result' : 'Unexpected fixture'] });
      continue;
    }
    seen.add(id);
    const { vp, theme, state } = expected.get(id);
    const findings = [];
    if (row.fixture !== state || row.theme !== theme || row.viewport?.width !== vp.width || row.viewport?.height !== vp.height)
      findings.push('Fixture metadata mismatch');
    if (!Array.isArray(row.failures)) findings.push('Missing geometry findings array');
    else findings.push(...row.failures.map(String));
    if (!row.geometry || typeof row.geometry !== 'object' || Array.isArray(row.geometry)) findings.push('Missing geometry observations');
    try {
      const bytes = readScreenshot(`${id}.png`);
      if (!Buffer.isBuffer(bytes) || bytes.length < 100) throw new Error('Empty/invalid image');
      screenshots++;
      artifacts.push(`${id}:${sha(bytes)}`);
    } catch (e) { findings.push(`Screenshot missing or unreadable: ${e.message}`); }
    if (findings.length) failures.push({ id, findings });
  }
  for (const id of expected.keys()) if (!seen.has(id)) failures.push({ id, findings: ['Missing fixture result'] });
  return {
    schemaVersion: 1, contractId: contract.id, authority: contract.authority,
    status: failures.length ? 'fail' : 'pass', expectedCases: 210, observedCases: seen.size,
    verifiedScreenshots: screenshots, screenshotManifestSha256: sha(artifacts.sort().join('\n')), failures,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const contractPath = process.argv[2];
  if (!contractPath) { console.error('Usage: node scripts/verify-visual-contract.mjs contracts/visual-cabinet.v1.json'); process.exitCode = 2; }
  else {
    const dir = path.resolve('screenshots/visual-fixtures');
    try {
      const contractRaw = readFileSync(contractPath);
      const contract = JSON.parse(contractRaw);
      let geometryRaw = null, rows = null;
      try { geometryRaw = readFileSync(path.join(dir, 'geometry.json')); rows = JSON.parse(geometryRaw); }
      catch (e) { console.error(`Geometry evidence missing: ${e.message}`); }
      const result = verifyVisualContract(contract, rows, filename => readFileSync(path.join(dir, filename)));
      const evidence = { ...result, contractSha256: sha(contractRaw), geometrySha256: geometryRaw && sha(geometryRaw), sourceSha: process.env.GITHUB_SHA || null,
        observedAt: new Date().toISOString(), limitation: 'Geometry and screenshot completeness only; artistic judgment and real-device acceptance require review.' };
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'run-contract-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
      console.log(`Visual contract ${result.status}: ${result.observedCases}/210 states, ${result.verifiedScreenshots} screenshots`);
      for (const f of result.failures.slice(0, 30)) console.error(`${f.id}: ${f.findings.join('; ')}`);
      if (result.failures.length > 30) console.error(`${result.failures.length - 30} more failures in run-contract-evidence.json`);
      if (result.status !== 'pass') process.exitCode = 1;
    } catch (e) { console.error(`Invalid visual contract: ${e.message}`); process.exitCode = 2; }
  }
}
