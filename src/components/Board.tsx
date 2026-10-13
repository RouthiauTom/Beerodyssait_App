import {useRef,useState} from 'react';
import board from '../../data/board.json';
import type {Player} from '../game/engine';

export default function Board({players,active,label,reset,language}: {players: Player[]; active: string; label: string; reset: string; language: 'fr'|'en'}) {
  const [zoom,setZoom] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number,{x:number;y:number}>());
  const previousDistance = useRef<number | null>(null);
  return <section className="board-card" aria-label={label}>
    <div className="board-tools"><span>{label}</span><div><button aria-label="Zoom −" onClick={()=>setZoom(z=>Math.max(1,z-.5))}>−</button><output>{Math.round(zoom*100)}%</output><button aria-label="Zoom +" onClick={()=>setZoom(z=>Math.min(3,z+.5))}>+</button><button onClick={()=>{setZoom(1);viewport.current?.scrollTo(0,0);}}>{reset}</button></div></div>
    <div className="board-viewport" ref={viewport} tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowRight')viewport.current?.scrollBy(80,0);if(e.key==='ArrowLeft')viewport.current?.scrollBy(-80,0);if(e.key==='ArrowDown')viewport.current?.scrollBy(0,80);if(e.key==='ArrowUp')viewport.current?.scrollBy(0,-80);}}
      onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});}}
      onPointerMove={e=>{
        const old=pointers.current.get(e.pointerId);if(!old)return;
        pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(pointers.current.size===1){viewport.current!.scrollLeft-=e.clientX-old.x;viewport.current!.scrollTop-=e.clientY-old.y;}
        else {const [a,b]=[...pointers.current.values()];const distance=Math.hypot(a.x-b.x,a.y-b.y);if(previousDistance.current)setZoom(z=>Math.max(1,Math.min(3,z*distance/previousDistance.current!)));previousDistance.current=distance;}
      }} onPointerUp={e=>{pointers.current.delete(e.pointerId);previousDistance.current=null;}} onPointerCancel={e=>{pointers.current.delete(e.pointerId);previousDistance.current=null;}}>
      <div className="board-map" style={{width:`${zoom*100}%`}}>
        <img src={`${import.meta.env.BASE_URL}assets/plateau-${language}.svg`} alt={label} draggable={false}/>
        {players.map((p,index)=>{
          const point=p.position===0?board.start:board.spaces.find(s=>s.id===p.position)!;
          const group=players.filter(other=>other.position===p.position);const offset=group.findIndex(other=>other.id===p.id);
          const angle=offset*2*Math.PI/group.length;
          const x=point.x*100+(group.length>1?Math.cos(angle)*1.6:0),y=point.y*100+(group.length>1?Math.sin(angle)*1.6:0);
          return <span key={p.id} className={`pawn ${p.id===active?'active':''}`} style={{left:`${x}%`,top:`${y}%`,background:p.color}} title={p.name} aria-label={p.name}>{index+1}</span>;
        })}
      </div>
    </div>
  </section>;
}
