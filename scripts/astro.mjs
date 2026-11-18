import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

// Prefer the supported checkout-local runtime without changing the user's system.
const local=resolve('.runtime/node_modules/node/bin/node');
const runtime=existsSync(local)?local:process.execPath;
const result=spawnSync(runtime,[resolve('node_modules/astro/bin/astro.mjs'),...process.argv.slice(2)],{
 stdio:'inherit',env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},
});
if(result.error){console.error(result.error.message);process.exit(1);}
process.exit(result.status??1);
