import { writable } from 'svelte/store';

const key = 'preferExternalOnTie';
const initial = typeof localStorage !== 'undefined' ? localStorage.getItem(key) === 'true' : false;

export const preferExternalOnTie = writable<boolean>(initial);

preferExternalOnTie.subscribe((v) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, String(v));
});
