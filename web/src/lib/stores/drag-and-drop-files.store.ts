//store to track the state of the drag and drop and the files
import { writable } from 'svelte/store';

export const dragAndDropFilesStore = writable({
  isDragging: false as boolean,
  files: [] as File[],
});
