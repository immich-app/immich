import { writable } from 'svelte/store';

export const numberOfComments = writable<number | undefined>(undefined);

export const setNumberOfComments = (number: number) => {
  numberOfComments.set(number);
};

export const updateNumberOfComments = (addOrRemove: 1 | -1) => {
  numberOfComments.update((n) => (n ? n + addOrRemove : undefined));
};
