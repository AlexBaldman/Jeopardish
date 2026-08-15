import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;

    const key = item.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = 'true';
    }
  }

  return args;
}

function slugify(value) {
  return String(value || 'work')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'work';
}

function gitValue(command, fallback) {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function listify(value) {
  const items = String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) return '- Not specified';
  return items.map((item) => `- ${item}`).join('\n');
}

const args = parseArgs(process.argv.slice(2));
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const date = timestamp.slice(0, 8).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
const agent = args.agent || process.env.AGENT_NAME || process.env.USER || 'unknown-agent';
const task = args.task || 'Unspecified work';
const status = args.status || 'completed';
const tool = args.tool || process.env.AGENT_TOOL || 'unspecified';
const branch = args.branch || gitValue('git branch --show-current', 'unknown');
const commitPr = args['commit-pr'] || args.commit || 'none';

const content = `# ${timestamp} - ${agent} - ${task}

Agent: ${agent}
Tool/CLI: ${tool}
Branch: ${branch}
Commit/PR: ${commitPr}
Status: ${status}

## Files Touched

${listify(args.files)}

## Summary

${args.summary || '- Not specified'}

## Validation

${args.validation || '- Not specified'}

## Risks / Follow-ups

${args.risks || '- Not specified'}

## Next-Agent Notes

${args['next-notes'] || '- Check coordination/active-work.md before editing overlapping files.'}
`;

const dir = path.join('coordination', 'logs', date);
fs.mkdirSync(dir, { recursive: true });

const filename = `${timestamp}-${slugify(agent)}-${slugify(task)}.md`;
const outPath = path.join(dir, filename);

fs.writeFileSync(outPath, content);
console.log(outPath);
