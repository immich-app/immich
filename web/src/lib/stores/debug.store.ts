import { writable } from 'svelte/store';

export const outstandingIntersectionTasks = writable<number>(0);
export const renderedImages = writable<number>(0);
