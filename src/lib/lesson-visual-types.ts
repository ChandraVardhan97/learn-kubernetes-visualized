export type Beat = readonly [from: string, action: string, to: string, result: string];
export type VisualStory = {
  title: string;
  takeaway: string;
  exercise?: 'hpa' | 'quorum';
  panels?: readonly string[];
  run?: { action: string; beats: readonly Beat[] };
};
export type VisualStories = Readonly<Record<string, VisualStory>>;

export function explain(title: string, takeaway: string, ...panels: string[]): VisualStory {
  return { title, takeaway, panels };
}

export function follow(title: string, takeaway: string, action: string, ...beats: Beat[]): VisualStory {
  return { title, takeaway, run: { action, beats } };
}
