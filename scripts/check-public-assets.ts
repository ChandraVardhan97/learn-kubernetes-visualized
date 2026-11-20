import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { labDownloadPaths, labs } from '../src/data/labs';
import { labReadme } from '../src/lib/lab-readme';
import { unsafePublicAssets, unexpectedLabAssets } from './lib/public-assets';

const roots = process.argv.slice(2);
if (!roots.length) roots.push('public');
const allowed = new Set([...labDownloadPaths, 'kv-labs.zip']);
const failures: string[] = [];
for (const root of roots) {
  if (!existsSync(root)) {
    failures.push(root + ': asset directory is missing');
    continue;
  }
  const labAllowed = new Set(allowed);
  if (root === 'dist') labAllowed.add('index.html');
  for (const file of new Set([...unsafePublicAssets(root), ...unexpectedLabAssets(root, labAllowed)])) {
    failures.push(root + '/' + file + ': private or unlisted runtime asset');
  }
  for (const path of allowed) {
    const file = join(root, 'labs', path);
    if (!existsSync(file)) {
      failures.push(file + ': missing lab download');
    } else if (root !== 'public' && !readFileSync(file).equals(readFileSync(join('public/labs', path)))) {
      failures.push(file + ': differs from its source asset');
    }
  }
  for (const lab of labs) {
    const readme = join(root, 'labs', lab.id, 'README.md');
    if (existsSync(readme) && readFileSync(readme, 'utf8') !== labReadme(lab)) failures.push(readme + ': README drift; run npm run build:lab-downloads');
  }
}
if (failures.length) {
  console.error('Publication refused. Check generated lab assets and keep runtime data outside public and dist.\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Public asset check passed (' + roots.join(', ') + '): listed lab downloads and current generated guides.');
}
