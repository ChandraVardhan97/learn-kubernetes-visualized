import { getCollection, type CollectionEntry } from 'astro:content';
export type Lesson = CollectionEntry<'lessons'>;
export const getLessons = async () => (await getCollection('lessons')).sort((a,b)=>a.data.module.localeCompare(b.data.module)||a.data.order-b.data.order);
export const lessonHref = (lesson:Lesson) => `/learn/${lesson.data.level}/${lesson.id.split('/').pop()}/`;
