import { writable } from 'svelte/store';

export const numberOfComments = writable<number>(0);

export const setNumberOfComments = (number: number) => {
  numberOfComments.set(number);
};

export const updateNumberOfComments = (addOrRemove: 1 | -1) => {
  numberOfComments.update((n) => n + addOrRemove);
};
