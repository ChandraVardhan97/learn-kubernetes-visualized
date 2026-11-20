import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { labDownloadPaths, labs } from '../src/data/labs';
import { labReadme } from '../src/lib/lab-readme';

const root = 'public/labs';
for (const lab of labs) writeFileSync(join(root, lab.id, 'README.md'), labReadme(lab));

const zipSource = [
  'from pathlib import Path',
  'from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED',
  'import json, sys',
  'root = Path(sys.argv[1])',
  'target = root / "kv-labs.zip"',
  'temporary = root / "kv-labs.tmp"',
  'try:',
  '    with ZipFile(temporary, "w") as archive:',
  '        for name in sorted(json.load(sys.stdin)):',
  '            member = ZipInfo(name, (2026, 1, 1, 0, 0, 0))',
  '            member.external_attr = 0o100644 << 16',
  '            archive.writestr(member, (root / name).read_bytes(), ZIP_DEFLATED)',
  '    temporary.replace(target)',
  'finally:',
  '    temporary.unlink(missing_ok=True)',
].join('\n');
const result = spawnSync('python3', ['-c', zipSource, root], { input: JSON.stringify(labDownloadPaths), stdio: ['pipe', 'inherit', 'inherit'] });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log('Generated ' + labs.length + ' lab guides and a ' + labDownloadPaths.length + '-file ZIP.');
