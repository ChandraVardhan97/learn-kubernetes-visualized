import type { Frame, SceneEdge } from './scene-types';

export type Point = { x: number; y: number };
export const diagramWidth = 800;
export const nodeWidth = 206;
export const nodeHeight = 110;

/** Reserve a slot for each identity wherever it appears together with other nodes. */
export function diagramLayout(frames: readonly Frame[]) {
 const positions = new Map<string, Point>();
 const neighbors = new Map<string, Set<string>>();

 for (const frame of frames) {
  for (const node of frame.nodes) {
   if (!neighbors.has(node.id)) neighbors.set(node.id, new Set());
   for (const other of frame.nodes) {
    if (other.id !== node.id) neighbors.get(node.id)!.add(other.id);
   }
   if (node.x !== undefined && node.y !== undefined && !positions.has(node.id)) {
    positions.set(node.id, { x: node.x, y: node.y });
   }
  }
 }

 for (const [id, adjacent] of neighbors) {
  if (positions.has(id)) continue;
  const occupied = [...adjacent].map(other => positions.get(other)).filter(p => p !== undefined);
  for (let slot = 0; ; slot++) {
   const position = { x: 34 + (slot % 3) * 263, y: 28 + Math.floor(slot / 3) * 166 };
   if (occupied.some(p => Math.abs(p.x - position.x) < nodeWidth + 24 &&
                          Math.abs(p.y - position.y) < nodeHeight + 24)) continue;
   positions.set(id, position);
   break;
  }
 }
 const mobileSlots = new Map<string, number>();
 for (const id of [...neighbors.keys()].sort((a, b) => {
  const p = positions.get(a)!, q = positions.get(b)!;
  return p.y - q.y || p.x - q.x;
 })) {
  const occupied = new Set([...neighbors.get(id)!].map(other => mobileSlots.get(other)));
  let slot = 0;
  while (occupied.has(slot)) slot++;
  mobileSlots.set(id, slot);
 }
 const mobileRows = Math.ceil((1 + Math.max(0, ...mobileSlots.values())) / 2);
 const height = Math.max(166, ...[...positions.values()].map(p => p.y + nodeHeight + 28));
 return { positions, height, mobileSlots, mobileRows };
}

export type DiagramLayout = ReturnType<typeof diagramLayout>;

const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function ports(node: Point, offset: number) {
 return [
  { point: { x: node.x + nodeWidth, y: node.y + nodeHeight / 2 + offset }, dx: 1, dy: 0 },
  { point: { x: node.x, y: node.y + nodeHeight / 2 + offset }, dx: -1, dy: 0 },
  { point: { x: node.x + nodeWidth / 2 + offset, y: node.y + nodeHeight }, dx: 0, dy: 1 },
  { point: { x: node.x + nodeWidth / 2 + offset, y: node.y }, dx: 0, dy: -1 },
 ];
}

function intersects(a: Point, b: Point, node: Point, padding: number) {
 return Math.max(a.x, b.x) > node.x - padding &&
  Math.min(a.x, b.x) < node.x + nodeWidth + padding &&
  Math.max(a.y, b.y) > node.y - padding &&
  Math.min(a.y, b.y) < node.y + nodeHeight + padding;
}

function rangesOverlap(a: number, b: number, c: number, d: number) {
 return Math.max(Math.min(a, b), Math.min(c, d)) < Math.min(Math.max(a, b), Math.max(c, d));
}

function sharesLane(a: Point, b: Point, c: Point, d: Point) {
 if (a.x === b.x && c.x === d.x) return Math.abs(a.x - c.x) < 7 && rangesOverlap(a.y, b.y, c.y, d.y);
 if (a.y === b.y && c.y === d.y) return Math.abs(a.y - c.y) < 7 && rangesOverlap(a.x, b.x, c.x, d.x);
 return false;
}

function simplify(points: Point[]) {
 const result: Point[] = [];
 for (const point of points) {
  const last = result.at(-1);
  if (last && distance(last, point) === 0) continue;
  const before = result.at(-2);
  if (last && before && distance(before, point) === distance(before, last) + distance(last, point) &&
      (before.x === point.x || before.y === point.y)) result.pop();
  result.push(point);
 }
 return result;
}

function roundedPath(points: Point[]) {
 const [start, ...rest] = points;
 let path = `M ${start.x} ${start.y}`;
 rest.forEach((corner, i) => {
  const a = points[i], b = rest[i + 1];
  if (!b) {
   path += ` L ${corner.x} ${corner.y}`;
   return;
  }
  const inLength = distance(a, corner), outLength = distance(corner, b);
  const radius = Math.min(8, inLength / 2, outLength / 2);
  const before = { x: corner.x + (a.x - corner.x) * radius / inLength, y: corner.y + (a.y - corner.y) * radius / inLength };
  const after = { x: corner.x + (b.x - corner.x) * radius / outLength, y: corner.y + (b.y - corner.y) * radius / outLength };
  path += ` L ${before.x} ${before.y} Q ${corner.x} ${corner.y} ${after.x} ${after.y}`;
 });
 return path;
}

/** Try straight and gutter routes; keep the connector out of every card. */
export function diagramConnections(frame: Frame, layout: DiagramLayout) {
 const cards = frame.nodes.map(node => layout.positions.get(node.id)!);
 const laneXs = [12, diagramWidth - 12, ...cards.flatMap(p => [p.x - 18, p.x + nodeWidth + 18])];
 const laneYs = [12, layout.height - 12, ...cards.flatMap(p => [p.y - 18, p.y + nodeHeight + 18])];
 const previous: Point[][] = [];

 function route(edge: SceneEdge, index: number) {
  const source = layout.positions.get(edge.from)!;
  const target = layout.positions.get(edge.to)!;
  const siblings = (id: string) => frame.edges!.flatMap((item, i) => item.from === id || item.to === id ? [i] : []);
  const offset = (id: string) => {
   const related = siblings(id);
   return (related.indexOf(index) - (related.length - 1) / 2) * Math.min(12, 60 / related.length);
  };
  let best: Point[] | undefined;
  let bestCost = Infinity;
  for (const from of ports(source, offset(edge.from))) {
   for (const to of ports(target, offset(edge.to))) {
    const start = { x: from.point.x + from.dx * 13, y: from.point.y + from.dy * 13 };
    const end = { x: to.point.x + to.dx * 13, y: to.point.y + to.dy * 13 };
    const finishGap = edge.state === 'blocked' ? 10 : 3;
    const finish = { x: to.point.x + to.dx * finishGap, y: to.point.y + to.dy * finishGap };
    const routes = [
     [start, { x: start.x, y: end.y }, end],
     [start, { x: end.x, y: start.y }, end],
     ...laneXs.map(x => [start, { x, y: start.y }, { x, y: end.y }, end]),
     ...laneYs.map(y => [start, { x: start.x, y }, { x: end.x, y }, end]),
    ];
    for (const points of routes) {
     const middle = simplify(points);
     if (middle.slice(1).some((p, i) => cards.some(card => intersects(middle[i], p, card, 9)))) continue;
     const path = simplify([from.point, ...middle, finish]);
     const cost = path.slice(1).reduce((sum, p, i) => {
      const q = path[i];
      const overlaps = previous.some(line => line.slice(1).some((b, j) => sharesLane(q, p, line[j], b)));
      return sum + distance(q, p) + 22 + (overlaps ? 55 : 0);
     }, 0);
     if (cost < bestCost) {
      bestCost = cost;
      best = path;
     }
    }
   }
  }
  if (!best) return null;
  previous.push(best);
  return { edge, path: roundedPath(best) };
 }

 return (frame.edges ?? []).map(route);
}
