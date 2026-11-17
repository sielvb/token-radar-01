// token-radar-01: the entrypoint. Node 22, standard library only, no network.
//
// What it does, in order: read the sealed snapshot (a file or a directory holding
// snapshot.json), score every pre-token protocol through lib/model.ts, refuse to
// continue when the board would fail the gate, write board.json and data.js, copy
// the dashboard and the screenshots into the output directory, and write the
// dossier last, since the scorer rebuilds it from the output and compares bytes.
//
// The dashboard itself is static: index.html, app.css and app.js read the data.js
// this program writes, so the page and the board can never drift apart.
//
// Local runs use MAKEFUN_OUTPUT_DIR in place of /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

const here = fileURLToPath(new URL('.', import.meta.url));

// Caps from the gate (reference/gate.json): the text cap shapes the dossier bytes,
// the screenshot caps refuse anything over them.
const DOSSIER_TEXT_CAP = 65_536;
const SHOT_LIMIT = { max: 4, max_bytes: 524_288 };
const SHOT_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;

// Read a `--flag value` or `--flag=value` argument, falling back when absent.
function flagValue(flag: string, fallback: string): string {
  for (let i = 2; i < process.argv.length; i += 1) {
    const current = process.argv[i]!;
    if (current === `--${flag}` && i + 1 < process.argv.length) return process.argv[i + 1]!;
    if (current.startsWith(`--${flag}=`)) return current.slice(flag.length + 3);
  }
  return fallback;
}

const inputGiven = flagValue('input', '/input');
const snapshotPath = inputGiven.endsWith('.json') ? inputGiven : join(inputGiven, 'snapshot.json');
if (!existsSync(snapshotPath)) {
  process.stderr.write(`token radar: no snapshot at ${snapshotPath}: pass --input <snapshot.json|directory> or mount the sealed /input\n`);
  process.exit(2);
}
const outDir = flagValue('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const snapshot = parseSnapshot(readFileSync(snapshotPath, 'utf8'));
const { board, radar } = buildRadar(snapshot);
const refused = boardIssue(board, snapshot);
if (refused !== null) {
  process.stderr.write(`token radar: the model wrote a board the gate refuses: ${refused}\n`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'board.json'), `${JSON.stringify({ rows: board })}\n`);
writeFileSync(join(outDir, 'data.js'), dataScript(radar));

// Copy every regular file of a directory into `dest`, skipping dotfiles,
// and report the names that were copied.
function copyDirectory(from: string, dest: string): string[] {
  const names: string[] = [];
  if (!existsSync(from)) return names;
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(from)) {
    if (name.startsWith('.')) continue;
    const source = join(from, name);
    if (!statSync(source).isFile()) continue;
    copyFileSync(source, join(dest, name));
    names.push(name);
  }
  return names;
}

copyDirectory(join(here, 'dashboard'), join(outDir, 'dashboard'));
const shots = copyDirectory(join(here, 'screenshots'), join(outDir, 'screenshots'));
if (shots.length < 3) {
  process.stderr.write(`token radar: screenshots/ holds ${shots.length} image${shots.length === 1 ? '' : 's'}: hand in 3, the board, a detail view and a filtered view\n`);
  process.exit(1);
}
for (const shot of shots) {
  if (!SHOT_NAME.test(shot)) {
    process.stderr.write(`token radar: screenshots/${shot}: a name is letters, digits and . _ -, 1 to 128 characters\n`);
    process.exit(1);
  }
}

// The dossier goes last: the scorer rebuilds it from this /output and compares bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: DOSSIER_TEXT_CAP,
    screenshots: SHOT_LIMIT,
    dashboard: { max_files: 400, max_bytes: 4_194_304 },
  }),
);

process.stdout.write(
  `token radar: ${snapshot.protocols.length} protocols, ${snapshot.watchlist.length} on the watchlist, ${board.length} rows scored (${radar.early_size} early, ${radar.live_size} live set aside)\n` +
    `token radar: wrote ${join(outDir, 'board.json')}, ${join(outDir, 'data.js')}, ${join(outDir, 'dashboard')} (3 files), ${join(outDir, 'screenshots')} (${shots.length} images) and ${join(outDir, 'dossier.json')}\n`,
);
