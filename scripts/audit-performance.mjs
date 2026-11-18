import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const base=process.env.KV_BASE_URL||'http://127.0.0.1:4322';
const dir='output/lighthouse';fs.mkdirSync(dir,{recursive:true});
const pages=['/','/learn/foundations/m05-l01/','/learn/advanced/m16-l02/'];
const chrome=await chromeLauncher.launch({chromeFlags:['--headless','--no-sandbox']});
const scores=[];
try{
 for(const route of pages){
  const response=await fetch(new URL(route,base));if(!response.ok)throw new Error(`${route}: HTTP ${response.status}`);
  const result=await lighthouse(new URL(route,base).href,{port:chrome.port,output:'html',onlyCategories:['performance','accessibility'],logLevel:'error'});
  const score={route,performance:Math.round(result.lhr.categories.performance.score*100),accessibility:Math.round(result.lhr.categories.accessibility.score*100)};
  scores.push(score);fs.writeFileSync(path.join(dir,route==='/'?'home.html':route.split('/').filter(Boolean).at(-1)+'.html'),result.report);
  console.log(JSON.stringify(score));
 }
}finally{chrome.kill();}
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);}
const allJs=walk('dist/_astro').filter(p=>p.endsWith('.js')).map(p=>({file:p,bytes:gzipSync(fs.readFileSync(p)).length}));
const jsGzip=allJs.reduce((sum,f)=>sum+f.bytes,0);
console.log(`All application JS combined (conservative upper bound): ${(jsGzip/1024).toFixed(1)} KiB gzip; deferred Pagefind excluded.`);
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify({scores,allApplicationJsGzipBytes:jsGzip,files:allJs},null,2));
if(scores.some(s=>s.performance<90||s.accessibility<95)||jsGzip>250*1024)process.exitCode=1;
