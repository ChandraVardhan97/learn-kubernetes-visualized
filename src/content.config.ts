import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const lessons = defineCollection({
 loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
 schema: z.object({
   lessonId:z.string().regex(/^m\d{2}-l0[1-3]$/), title:z.string(),description:z.string(),
   level:z.enum(['foundations','intermediate','advanced']),module:z.string().regex(/^m\d{2}$/),order:z.number().int().min(1).max(3),
   minutes:z.number().int().positive(),prerequisites:z.array(z.string()),objectives:z.array(z.string()).min(2),
   concepts:z.array(z.object({id:z.string(),title:z.string(),scene:z.string()})).min(1),
   sources:z.array(z.object({title:z.string(),url:z.url().startsWith('https://')})).min(1),
   lab:z.string(),reviewed:z.string(),kubernetesVersion:z.string(),
 })
});
export const collections = { lessons };
