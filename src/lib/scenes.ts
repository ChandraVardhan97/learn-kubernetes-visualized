import type { Scene } from './scene-types';
const files = import.meta.glob<{default:Scene[]}>('../content/scenes/**/*.json',{eager:true});
export const scenes: Scene[] = Object.values(files).flatMap(f=>f.default);
export const getScene = (id:string):Scene => {
 const scene = scenes.find(s=>s.id===id);
 if(!scene) throw new Error(`Unknown scene: ${id}`);
 return scene;
};
