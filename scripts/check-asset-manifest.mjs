import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const manifestPath = 'viewer/src/assets/ASSET_MANIFEST.tsv';
const expectedHeader = [
  'path',
  'sha256',
  'author',
  'source_or_derivation',
  'license',
  'license_url',
  'avatar_permission',
  'commercial_usage',
  'redistribution',
  'modification',
  'credit_notation',
  'allow_excessively_violent_usage',
  'allow_excessively_sexual_usage',
  'allow_political_or_religious_usage',
  'allow_antisocial_or_hate_usage',
];

const manifest = await readFile(manifestPath, 'utf8');
const lines = manifest.split(/\r?\n/u).filter((line) => line.length > 0);
const header = lines.shift()?.split('\t') ?? [];

if (header.join('\t') !== expectedHeader.join('\t')) {
  throw new Error(`Unexpected header in ${manifestPath}`);
}

const entries = new Map();
for (const [index, line] of lines.entries()) {
  const fields = line.split('\t');
  if (fields.length !== expectedHeader.length || fields.some((field) => field.length === 0)) {
    throw new Error(`Malformed or incomplete row ${index + 2} in ${manifestPath}`);
  }

  const entry = Object.fromEntries(expectedHeader.map((key, fieldIndex) => [key, fields[fieldIndex]]));
  if (!/^[0-9a-f]{64}$/u.test(entry.sha256)) {
    throw new Error(`Invalid SHA-256 for ${entry.path}`);
  }
  if (entries.has(entry.path)) {
    throw new Error(`Duplicate manifest entry for ${entry.path}`);
  }
  entries.set(entry.path, entry);
}

const trackedAssets = execFileSync('git', ['ls-files', '--', 'viewer/src/assets'], { encoding: 'utf8' })
  .split(/\r?\n/u)
  .filter((path) => path.endsWith('.glb'))
  .sort();

const manifestAssets = [...entries.keys()].sort();
const missing = trackedAssets.filter((path) => !entries.has(path));
const extra = manifestAssets.filter((path) => !trackedAssets.includes(path));

if (missing.length > 0 || extra.length > 0) {
  throw new Error(`Asset manifest mismatch. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`);
}

for (const path of trackedAssets) {
  const digest = createHash('sha256').update(await readFile(path)).digest('hex');
  if (digest !== entries.get(path).sha256) {
    throw new Error(`SHA-256 mismatch for ${path}: expected ${entries.get(path).sha256}, got ${digest}`);
  }
}

console.log(`Verified ${trackedAssets.length} tracked GLB asset against ${manifestPath}.`);
