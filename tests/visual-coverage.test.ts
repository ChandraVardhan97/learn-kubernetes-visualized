import { describe, expect, it } from 'vitest';
import { scenes } from '../src/lib/scenes';
import { stories } from '../src/data/lesson-visuals';
import { getPilot } from '../src/lib/pilot-scenes';

describe('curriculum visual coverage', () => {
  it('gives every scene a revised visual while keeping its stable scene ID', () => {
    expect(Object.keys(stories).sort()).toEqual(scenes.filter(scene => !getPilot(scene.id)).map(scene => scene.id).sort());
    for (const scene of scenes) {
      const entry = stories[scene.id];
      if (!entry) continue;
      if (entry.run) {
        expect(entry.run.beats.length, scene.id).toBeGreaterThanOrEqual(3);
        for (const beat of entry.run.beats) expect(beat.every(field => field.length > 0), scene.id).toBe(true);
      } else {
        expect(entry.panels, scene.id).toHaveLength(scene.frames.length);
      }
    }
  });
});
