import type { VisualStories } from '../../lib/lesson-visual-types';
import { foundations } from './foundations';
import { intermediate } from './intermediate';
import { advanced } from './advanced';

export const stories: VisualStories = { ...foundations, ...intermediate, ...advanced };

export function getVisualStory(id: string) {
  return stories[id];
}
