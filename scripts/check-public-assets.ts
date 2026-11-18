import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {labs} from '../src/data/labs';
import {unsafePublicAssets,unexpectedLabAssets} from './lib/public-assets';

const roots=process.argv.slice(2);if(!roots.length)roots.push('public');
const allowed=new Set(['README.md','kind.yaml','kv-labs.zip',...labs.flatMap(l=>l.files.map(f=>`${l.id}/${f.name}`))]);
const failures:string[]=[];
for(const root of roots){
 if(!existsSync(root)){failures.push(`${root}: asset directory is missing`);continue;}
 const labAllowed=new Set(allowed);if(root==='dist')labAllowed.add('index.html');
 for(const file of new Set([...unsafePublicAssets(root),...unexpectedLabAssets(root,labAllowed)]))failures.push(`${root}/${file}: private or unlisted runtime asset`);
 for(const lab of labs)for(const asset of lab.files){const file=join(root,'labs',lab.id,asset.name);if(!existsSync(file)||readFileSync(file,'utf8')!==asset.content)failures.push(`${file}: differs from the reviewed exercise download`);}
}
if(failures.length){console.error('Publication refused. Keep lab runtime data outside public and dist.\n'+failures.join('\n'));process.exitCode=1;}
else console.log(`Public asset check passed (${roots.join(', ')}): only reviewed lab downloads; no recovery data or credentials.`);
