export interface Progress {version:1;completed:string[];bookmarks:string[];lastLesson?:string}
export const PROGRESS_KEY='kubernetes-visualized:progress:v1';
export const emptyProgress=():Progress=>({version:1,completed:[],bookmarks:[]});
export function parseProgress(text:string):Progress {
 const value:unknown=JSON.parse(text);
 if(!value||typeof value!=='object') throw new Error('Choose a valid progress file.');
 const p=value as Record<string,unknown>;
 if(p.version!==1||!Array.isArray(p.completed)||!Array.isArray(p.bookmarks)||!p.completed.every(x=>typeof x==='string')||!p.bookmarks.every(x=>typeof x==='string')||(p.lastLesson!==undefined&&typeof p.lastLesson!=='string')) throw new Error('This progress file has an unsupported version or invalid format.');
 return {version:1,completed:[...new Set(p.completed)],bookmarks:[...new Set(p.bookmarks)],...(p.lastLesson?{lastLesson:p.lastLesson as string}:{})};
}
export function importProgress(text:string,current:Progress,knownIds:string[]):Progress {
 const incoming=parseProgress(text);const known=new Set(knownIds);
 return {version:1,completed:[...new Set([...current.completed,...incoming.completed])].filter(id=>known.has(id)),bookmarks:[...new Set([...current.bookmarks,...incoming.bookmarks])].filter(id=>known.has(id)),lastLesson:incoming.lastLesson&&known.has(incoming.lastLesson)?incoming.lastLesson:current.lastLesson};
}
export function readProgress(fallback:Progress=emptyProgress()):Progress {try{return parseProgress(localStorage.getItem(PROGRESS_KEY)||JSON.stringify(emptyProgress()));}catch{return fallback;}}
export function saveProgress(value:Progress):boolean {try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent('learning-progress',{detail:value}));return true;}catch{return false;}}
