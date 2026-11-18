import {useEffect,useState} from 'react';
import {readProgress,saveProgress,emptyProgress,type Progress} from '../lib/progress';
export default function LessonProgress({id}:{id:string}) {
 const [hydrated,setHydrated]=useState(false);
 const [progress,setProgress]=useState<Progress>(emptyProgress()),[notice,setNotice]=useState('');
 useEffect(()=>{const p={...readProgress(),lastLesson:id};setProgress(p);setHydrated(true);if(!saveProgress(p))setNotice('Storage is unavailable. Progress is kept for this page only.');const refresh=()=>setProgress(previous=>readProgress(previous));window.addEventListener('storage',refresh);window.addEventListener('learning-progress',refresh);return()=>{window.removeEventListener('storage',refresh);window.removeEventListener('learning-progress',refresh);};},[id]);
 function toggle(key:'completed'|'bookmarks'){const current=readProgress(progress);const next={...current,lastLesson:id,[key]:current[key].includes(id)?current[key].filter(x=>x!==id):[...current[key],id]};setProgress(next);if(!saveProgress(next))setNotice('Storage is unavailable. Progress is kept for this page only.');}
 return <div className="lesson-progress"><div><button disabled={!hydrated} className={progress.completed.includes(id)?'completed':''} onClick={()=>toggle('completed')} aria-pressed={progress.completed.includes(id)}>{progress.completed.includes(id)?'Completed':'Mark complete'}</button><button disabled={!hydrated} onClick={()=>toggle('bookmarks')} aria-pressed={progress.bookmarks.includes(id)}>{progress.bookmarks.includes(id)?'Bookmarked':'Bookmark lesson'}</button></div>{notice&&<p role="status">{notice}</p>}</div>;
}
