# Content authoring contract

Each module has three focused MDX lessons. Files: src/content/lessons/<level>/<slug>.mdx. Scene definitions: src/content/scenes/<level>/<lesson-id>.json (an array of Scene objects). Modules are defined in src/data/modules.ts. Stable lessonId: m01-l01 through m20-l03. The frontmatter module is m01..m20, order is 1..3, level foundations/intermediate/advanced. reviewed 2026-10-27, kubernetesVersion 1.37. lab is the module ID. Every lesson imports Scene from '../../../components/Scene.astro' and embeds <Scene id="scene-id" /> for each declared concept's scene. Scenes can cover related concepts only if frames actually explain each concept. At least one focused scene per lesson, normally two or three. Avoid generic stand-in scenes.

Frontmatter fields: lessonId, title, description, level, module, order, minutes (integer), prerequisites (stable lesson IDs), objectives (3 strings), concepts (array of {id, title, scene}), sources (array of {title,url}, primary official https sources), lab, reviewed, kubernetesVersion.

Each lesson must have substantive prose (roughly 600-1000 words or more where needed), clear ## headings (mental-model, walkthrough, practice, pitfalls, check-your-understanding), real annotated YAML and commands, expected outcomes, one or more prediction questions in <details><summary>Question</summary>...answer/rationale...</details>, next-step ideas, and a link to /labs/#mXX. Explain each named concept, not merely mention it. Split module concepts meaningfully across its three lessons. No lorem/TODO/coming soon. Do not invent measured results. Use stable APIs; flag optional add-ons and local limitations. Source links should be specific.

Scene JSON shape:
```ts
type Scene = {
 id: string; title: string;
 kind: 'cluster'|'flow'|'ownership'|'lifecycle'|'scheduling'|'storage'|'policy'|'chart'|'queue';
 description: string;
 assumption: string; // material simplification only, concrete
 frames: Frame[]; // 3-6 sequential, concept-specific states
 variants?: {id:string;label:string;description:string;frames:Frame[]}[]; // at least one meaningful alternate/failure scenario
};
type Frame = {
 title:string; narration:string;
 nodes: {id:string;label:string;detail?:string;type?:'control'|'node'|'pod'|'service'|'storage'|'actor'|'object';state?:'idle'|'active'|'ready'|'warning'|'failed';x?:number;y?:number;group?:string}[];
 edges?: {from:string;to:string;label?:string;state?:'idle'|'active'|'blocked'}[];
 metrics?: {label:string;value:number;max:number;unit?:string}[];
 code?:string; // accurate YAML or kubectl with current frame's values
};
```
Positions are optional. Default renderer lays out up to 6 nodes in a 3-column 2-row layout; use at most 8. When specifying positions, coordinates are node top-left in a 760x340 viewBox, node size 170x72, x between 20 and 570 and y between 25 and 235. Arrows reference node IDs. Each diagram must make the narrated mechanism legible. Use actual component/resource names and a meaningful alternate branch. A scene's frames and code are the single source for visible diagram and narration. Can use subset of nodes each step.

Root owns UI, types, modules, scene loader and validation. Content authors own only assigned level MDX and scene JSON. Root owns labs and cross-level prerequisites validation. Do not modify other files or commit without being asked. Do not spawn subagents.
