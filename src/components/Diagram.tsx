import { useEffect, useId, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Frame, SceneKind, SceneNode } from '../lib/scene-types';
import { diagramConnections, diagramLayout, diagramWidth, nodeHeight, nodeWidth } from '../lib/diagram-layout';
import type { DiagramLayout } from '../lib/diagram-layout';

const glyphs: Record<NonNullable<SceneNode['type']>, string> = {
 control: 'M8 2 14 5.5v5L8 14l-6-3.5v-5L8 2Zm0 7 6-3.5M8 9 2 5.5m6 3.5v5',
 node: 'M2 3h12v10H2zM2 8h12M5 5.5h.5M5 10.5h.5',
 pod: 'M2 4h5v8H2zM9 4h5v8H9z',
 service: 'M2 8h12m-3-3 3 3-3 3M5 5 2 8l3 3',
 storage: 'M2 5c0-3 12-3 12 0v6c0 3-12 3-12 0V5c0 3 12 3 12 0',
 actor: 'M10.5 5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM3 14v-2a5 5 0 0 1 10 0v2',
 object: 'M4 2h5l3 3v9H4zM9 2v4h3M6 9h4m-4 2h4',
};

const stateLabels = { idle: 'Context', active: 'In focus', ready: 'Ready', warning: 'Warning', failed: 'Failed' };

function NodeContent({ node }: { node: SceneNode }) {
 return <>
  <strong>{node.label}</strong>
  {node.detail && <span className="node-detail">{node.detail}</span>}
  <small className="node-status">
   <svg aria-hidden="true" viewBox="0 0 16 16"><path d={glyphs[node.type ?? 'object']}/></svg>
   <span>{stateLabels[node.state ?? 'idle']}</span>
  </small>
 </>;
}

export function DiagramLinks({ frame }: { frame: Frame }) {
 const labels = new Map(frame.nodes.map(node => [node.id, node.label]));
 if (!frame.edges?.length) return null;
 return <ul className="diagram-links" aria-label="Diagram relationships">
  {frame.edges.map((edge, i) => <li key={`${edge.from}-${edge.to}-${i}`} className={edge.state}>
   <span className="link-direction">
    <strong>{labels.get(edge.from)}</strong>
    <span className="link-symbol" aria-hidden="true">{edge.state === 'blocked' ? '⇥' : '→'}</span>
    <span className="sr-only">{edge.state === 'blocked' ? ' blocked toward ' : ' to '}</span>
    <strong>{labels.get(edge.to)}</strong>
   </span>
   {edge.label && <span className="link-label">{edge.label}</span>}
  </li>)}
 </ul>;
}

export function Diagram({ frame, kind = 'flow', layout, speed = 1, showLinks = true }: {
 frame: Frame;
 kind?: SceneKind;
 layout?: DiagramLayout;
 speed?: number;
 showLinks?: boolean;
}) {
 const marker = useId().replace(/:/g, '');
 const [mounted, setMounted] = useState(false);
 useEffect(() => setMounted(true), []);
 const geometry = useMemo(() => layout ?? diagramLayout([frame]), [layout, frame]);
 const connections = useMemo(() => diagramConnections(frame, geometry), [frame, geometry]);
 const style = { '--diagram-motion': `${Math.max(180, Math.min(420, 300 / speed))}ms` } as CSSProperties;
 const description = [
  frame.narration,
  ...frame.nodes.map(node => [node.label, node.detail, node.state].filter(Boolean).join(', ')),
 ].join('. ');
 return <div className="diagram-panel" data-motion={mounted ? 'enabled' : undefined} style={style}>
  <svg className={`diagram diagram-${kind}`} viewBox={`0 0 ${diagramWidth} ${geometry.height}`} role="img" aria-label={frame.title}>
   <title>{frame.title}</title>
   <desc>{description}</desc>
   <defs>
    <marker id={`${marker}-arrow`} viewBox="0 0 10 10" markerWidth="8" markerHeight="8" refX="8" refY="5" orient="auto" markerUnits="userSpaceOnUse">
     <path d="m2 1 6 4-6 4" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </marker>
    <marker id={`${marker}-stop`} viewBox="0 0 10 10" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto" markerUnits="userSpaceOnUse">
     <path d="m2 2 6 6m0-6-6 6" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round"/>
    </marker>
   </defs>
   {connections.map((connection, i) => {
    if (!connection) return null;
    const { edge, path } = connection;
    return <g key={`${edge.from}-${edge.to}-${i}-${path}`} className={`diagram-edge ${edge.state ?? 'idle'}`}>
     <path className="connector" d={path} markerEnd={`url(#${marker}-${edge.state === 'blocked' ? 'stop' : 'arrow'})`}/>
    </g>;
   })}
   {frame.nodes.map(node => {
    const { x, y } = geometry.positions.get(node.id)!;
    return <g key={node.id} transform={`translate(${x} ${y})`} className={`diagram-node ${node.state ?? 'idle'} type-${node.type ?? 'object'}`}>
     <title>{node.detail ? `${node.label}: ${node.detail}` : node.label}</title>
     <rect className="node-shape" width={nodeWidth} height={nodeHeight} rx={kind === 'lifecycle' ? 18 : 10}/>
     <foreignObject width={nodeWidth} height={nodeHeight}>
      <div className="diagram-node-content" key={`${node.label}|${node.detail ?? ''}`}><NodeContent node={node}/></div>
     </foreignObject>
    </g>;
   })}
  </svg>
  <div className="diagram-mobile" aria-label={`${frame.title} diagram`}>
   <div className="mobile-nodes" style={{ gridTemplateRows: `repeat(${geometry.mobileRows}, minmax(76px, auto))` }}>
    {[...frame.nodes].sort((a, b) => geometry.mobileSlots.get(a.id)! - geometry.mobileSlots.get(b.id)!).map(node => {
     const slot = geometry.mobileSlots.get(node.id)!;
     return <div key={node.id} className={`mobile-node ${node.state ?? 'idle'}`} style={{ gridColumn: slot % 2 + 1, gridRow: Math.floor(slot / 2) + 1 }}>
      <NodeContent node={node}/>
     </div>;
    })}
   </div>
  </div>
  {!!frame.metrics?.length && <div className="scene-metrics">{frame.metrics.map(m => <div key={m.label}><div><span>{m.label}</span><strong>{m.value}{m.unit} <small>/ {m.max}{m.unit}</small></strong></div><meter min="0" max={m.max} value={m.value}>{m.value} of {m.max}</meter></div>)}</div>}
  {showLinks && <DiagramLinks frame={frame}/>}
 </div>;
}
