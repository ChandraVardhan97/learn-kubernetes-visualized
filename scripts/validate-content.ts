import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'yaml';
import {modules} from '../src/data/modules';
import type {Scene} from '../src/lib/scene-types';
import {diagramConnections,diagramLayout,diagramWidth,nodeHeight,nodeWidth} from '../src/lib/diagram-layout';

function files(dir:string,ext:string):string[]{if(!fs.existsSync(dir))return[];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name),ext):e.name.endsWith(ext)?[path.join(dir,e.name)]:[]);}
const errors:string[]=[];const lessons=files('src/content/lessons','.mdx').map(file=>{const text=fs.readFileSync(file,'utf8');const match=text.match(/^---\r?\n([\s\S]*?)\r?\n---/);if(!match){errors.push(`${file}: frontmatter missing`);return null;}return {file,text,data:parse(match[1])};}).filter(Boolean) as {file:string;text:string;data:any}[];
const scenes:Scene[]=files('src/content/scenes','.json').flatMap(file=>{try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{errors.push(`${file}: invalid JSON`);return[];}});
const sceneIds=new Set<string>();
for(const scene of scenes){
 if(sceneIds.has(scene.id))errors.push(`Duplicate scene ID: ${scene.id}`);sceneIds.add(scene.id);
 if(!scene.description||!scene.assumption||scene.frames.length<3)errors.push(`${scene.id}: missing explanatory metadata or frames`);
 if(!scene.variants?.length)errors.push(`${scene.id}: meaningful alternate scenario missing`);
 const frames=[...scene.frames,...(scene.variants??[]).flatMap(v=>v.frames)];
 const layout=diagramLayout(frames);
 for(const frame of frames){
  if(!frame.title||!frame.narration||!frame.nodes?.length)errors.push(`${scene.id}: incomplete frame`);
  const ids=new Set(frame.nodes.map(n=>n.id));if(ids.size!==frame.nodes.length)errors.push(`${scene.id}: duplicate nodes`);
  if(frame.nodes.length>8)errors.push(`${scene.id}: diagram exceeds the eight-node readable limit`);
  const edges=frame.edges??[];
  if(edges.some(edge=>!ids.has(edge.from)||!ids.has(edge.to)||edge.from===edge.to)){
   errors.push(`${scene.id}: invalid diagram edge in "${frame.title}"`);
  }else if(diagramConnections(frame,layout).some(connection=>!connection)){
   errors.push(`${scene.id}: unroutable diagram edge in "${frame.title}"`);
  }
  const positions=frame.nodes.map(node=>layout.positions.get(node.id)!);
  for(const [index,position] of positions.entries()){
   if(position.x<0||position.y<0||position.x+nodeWidth>diagramWidth||position.y+nodeHeight>layout.height){
    errors.push(`${scene.id}: node outside the diagram in "${frame.title}"`);
   }
   if(positions.slice(index+1).some(other=>Math.abs(other.x-position.x)<nodeWidth&&Math.abs(other.y-position.y)<nodeHeight)){
    errors.push(`${scene.id}: overlapping nodes in "${frame.title}"`);
   }
  }
  for(const m of frame.metrics??[])if(m.max<=0||m.value<0||m.value>m.max)errors.push(`${scene.id}: invalid metric scale`);
 }
}
const lessonIds=new Set<string>();const conceptIds=new Set<string>();
for(const {data:d,text,file} of lessons){
 if(lessonIds.has(d.lessonId))errors.push(`Duplicate lesson ID: ${d.lessonId}`);lessonIds.add(d.lessonId);
 if(!modules.some(m=>m.id===d.module&&m.level===d.level))errors.push(`${file}: invalid module/level`);
 if(d.lessonId!==`${d.module}-l0${d.order}`)errors.push(`${file}: stable lesson ID does not match module/order`);
 if(d.lab!==d.module)errors.push(`${file}: incorrect module lab reference`);
 if(!d.objectives?.length||!d.sources?.length||!d.concepts?.length||!d.reviewed||!d.kubernetesVersion)errors.push(`${file}: lesson contract incomplete`);
 for(const c of d.concepts??[]){if(conceptIds.has(c.id))errors.push(`Duplicate concept ID: ${c.id}`);conceptIds.add(c.id);if(!sceneIds.has(c.scene))errors.push(`${file}: missing scene ${c.scene}`);if(!text.includes(`id="${c.scene}"`))errors.push(`${file}: scene ${c.scene} is not embedded`);}
 if(/\b(lorem ipsum|TODO|coming soon|TBD)\b/i.test(text))errors.push(`${file}: placeholder content`);
 if(!/## .*?(mental|model|understand)/i.test(text))errors.push(`${file}: mental-model section missing`);
 if(!text.includes('<details>')||!text.includes('```'))errors.push(`${file}: prediction question or code example missing`);
 if(!text.includes(`/labs/#${d.lab}`))errors.push(`${file}: lab reference missing`);
}
for(const {data:d} of lessons)for(const prereq of d.prerequisites??[])if(!lessonIds.has(prereq))errors.push(`${d.lessonId}: unknown prerequisite ${prereq}`);
const visiting=new Set<string>(),visited=new Set<string>();
function visit(id:string){if(visiting.has(id)){errors.push(`Prerequisite cycle at ${id}`);return;}if(visited.has(id))return;visiting.add(id);const d=lessons.find(l=>l.data.lessonId===id)?.data;for(const p of d?.prerequisites??[])visit(p);visiting.delete(id);visited.add(id);}
for(const id of lessonIds)visit(id);
for(const m of modules)if(lessons.filter(l=>l.data.module===m.id).length!==3)errors.push(`${m.id}: expected three complete lessons`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else {
 console.log(`Content verified: ${lessons.length} lessons, ${modules.length} modules, ${conceptIds.size} concepts, ${scenes.length} scenes. No missing references or prerequisite cycles.`);
 if(process.argv.includes('--inventory')){
  const lines=['# Concept and scene coverage','',`Generated from the validated curriculum: ${lessons.length} lessons, ${conceptIds.size} concepts, ${scenes.length} scenes.`,''];
  for(const module of modules){lines.push(`## ${module.id}: ${module.title}`,'','| Lesson | Concept | Scene |','| --- | --- | --- |');for(const l of lessons.filter(l=>l.data.module===module.id))for(const c of l.data.concepts)lines.push(`| ${l.data.lessonId}: ${l.data.title} | ${c.title} | ${c.scene} |`);lines.push('');}
  fs.writeFileSync('docs/COVERAGE.md',lines.join('\n').trimEnd()+'\n');
 }
}
