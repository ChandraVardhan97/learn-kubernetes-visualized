import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';

interface SelectOption {value:string;label:string}
interface SelectControlProps {
 label:string;
 value:string;
 options:SelectOption[];
 onChange:(value:string)=>void;
 disabled?:boolean;
 compact?:boolean;
 className?:string;
}

/** A select-only combobox; the popup uses the top layer to escape scene clipping. */
export default function SelectControl({label,value,options,onChange,disabled=false,compact=false,className=''}:SelectControlProps){
 const id=useId();
 const trigger=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null);
 const selected=Math.max(0,options.findIndex(option=>option.value===value));
 const [open,setOpen]=useState(false),[active,setActive]=useState(selected);
 const typed=useRef({text:'',time:0});
 const optionId=(index:number)=>`${id}-option-${index}`;

 function position(){
  if(!trigger.current||!menu.current)return;
  const rect=trigger.current.getBoundingClientRect(),popup=menu.current;
  const viewportWidth=document.documentElement.clientWidth,viewportHeight=window.innerHeight;
  if(rect.bottom<=0||rect.top>=viewportHeight){close();return;}
  const width=Math.min(Math.max(rect.width,compact?120:280),viewportWidth-24);
  popup.style.width=`${width}px`;
  const below=viewportHeight-rect.bottom-20,above=rect.top-20;
  const room=below>=Math.min(popup.scrollHeight,320)||below>=above?below:above;
  const height=Math.max(44,Math.min(320,room));
  popup.style.maxHeight=`${height}px`;
  const actualHeight=Math.min(popup.scrollHeight,height);
  const top=below>=actualHeight?rect.bottom+8:Math.max(12,rect.top-actualHeight-8);
  popup.style.left=`${Math.max(12,Math.min(rect.left,viewportWidth-width-12))}px`;
  popup.style.top=`${top}px`;
 }
 function show(index=selected){
  if(disabled||!menu.current)return;
  setActive(index);menu.current.showPopover();position();setOpen(true);
 }
 function close(){menu.current?.hidePopover();setOpen(false);typed.current={text:'',time:0};}
 function commit(index:number,restoreFocus=true){
  if(options[index].value!==value)onChange(options[index].value);
  close();
  if(restoreFocus)trigger.current?.focus({preventScroll:true});
 }
 useEffect(()=>{
  if(!open)return;
  const reposition=(event:Event)=>{
   if(event.type==='scroll'&&event.target instanceof Node&&menu.current?.contains(event.target))return;
   position();
  };
  window.addEventListener('resize',reposition);window.addEventListener('scroll',reposition,true);
  return()=>{window.removeEventListener('resize',reposition);window.removeEventListener('scroll',reposition,true);};
 },[open,compact]);
 useEffect(()=>{if(open)document.getElementById(optionId(active))?.scrollIntoView({block:'nearest'});},[open,active]);
 useEffect(()=>{if(disabled&&menu.current?.matches(':popover-open'))close();},[disabled]);

 function keydown(event:KeyboardEvent<HTMLButtonElement>){
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close();return;}
  if(event.key==='Tab'){if(open)commit(active,false);return;}
  if(event.key==='Enter'||event.key===' '){event.preventDefault();if(open)commit(active);else show();return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();
   if(open&&event.altKey&&event.key==='ArrowUp'){commit(active);return;}
   if(!open)show(event.key==='ArrowUp'?0:selected);
   else setActive(index=>Math.max(0,Math.min(options.length-1,index+(event.key==='ArrowDown'?1:-1))));
   return;
  }
  if(['Home','End','PageUp','PageDown'].includes(event.key)){
   event.preventDefault();
   const index=event.key==='Home'?0:event.key==='End'?options.length-1:Math.max(0,Math.min(options.length-1,(open?active:selected)+(event.key==='PageDown'?10:-10)));
   if(open)setActive(index);else show(index);return;
  }
  if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
   event.preventDefault();const now=Date.now(),character=event.key.toLocaleLowerCase();
   const text=now-typed.current.time>700?character:typed.current.text+character;
   typed.current={text,time:now};
   const query=[...text].every(letter=>letter===character)?character:text;
   const start=query.length===1?(open?active:selected)+1:0;
   const order=options.map((_,index)=>(index+start)%options.length);
   const match=order.find(index=>options[index].label.toLocaleLowerCase().startsWith(query));
   if(match!==undefined){if(open)setActive(match);else show(match);}
  }
 }
 return <div className={`choice-select ${compact?'choice-select--compact':''} ${className}`}>
  <span id={`${id}-label`} className="choice-select__label">{label}</span>
  <button ref={trigger} type="button" role="combobox" aria-labelledby={`${id}-label`} aria-haspopup="listbox" aria-controls={`${id}-listbox`} aria-expanded={open} aria-activedescendant={open?optionId(active):undefined} disabled={disabled} className="choice-select__trigger" onClick={()=>open?close():show()} onKeyDown={keydown} onBlur={()=>{if(open)commit(active,false);}}>
   <span className="choice-select__value">{options[selected].label}</span>
   <svg className="choice-select__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </button>
  <div ref={menu} id={`${id}-listbox`} role="listbox" aria-labelledby={`${id}-label`} popover="auto" className="choice-select__menu" onToggle={event=>{setOpen(event.currentTarget.matches(':popover-open'));}}>
   {options.map((option,index)=><div id={optionId(index)} key={option.value} role="option" aria-selected={option.value===value} data-active={active===index?true:undefined} className="choice-select__option" onMouseDown={event=>event.preventDefault()} onPointerMove={event=>{if(event.pointerType==='mouse')setActive(index);}} onClick={()=>commit(index)}>
    <span>{option.label}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
   </div>)}
  </div>
 </div>;
}
