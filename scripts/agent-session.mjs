import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

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
  return String(value || 'agent')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'agent';
}

const args = parseArgs(process.argv.slice(2));
const agent = args.agent || 'agent';
const command = args.command;
const task = args.task || 'session';

if (!command) {
  console.error('Usage: npm run agent:session -- --agent Gemini --command "gemini" [--task "migration-review"]');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const dir = path.join('coordination', 'live');
fs.mkdirSync(dir, { recursive: true });

const logPath = path.join(dir, `${timestamp}-${slugify(agent)}-${slugify(task)}.log`);
const currentPath = path.join(dir, `${slugify(agent)}-current.log`);
const logStream = fs.createWriteStream(logPath, { flags: 'a' });
const currentStream = fs.createWriteStream(currentPath, { flags: 'w' });

function write(chunk) {
  logStream.write(chunk);
  currentStream.write(chunk);
}

const header = [
  `# Live session`,
  `timestamp: ${timestamp}`,
  `agent: ${agent}`,
  `task: ${task}`,
  `command: ${command}`,
  ``,
].join('\n');

write(header);
process.stdout.write(`Logging ${agent} session to ${logPath}\n`);
process.stdout.write(`Current log mirror: ${currentPath}\n`);

const child = spawn(command, {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
});

child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  write(chunk);
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
  write(chunk);
});

child.on('close', (code) => {
  const footer = `\n\n# Session ended with code ${code}\n`;
  write(footer);
  logStream.end();
  currentStream.end();
  process.exit(code ?? 0);
});
