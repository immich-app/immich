import { writable } from 'svelte/store';

export type TiePreference = 'default' | 'external' | 'internal';

const KEY = 'duplicateTiePreference';
const LEGACY_KEY = 'preferExternalOnTie';

function getInitial(): TiePreference {
  if (typeof localStorage === 'undefined') return 'default';
  const saved = localStorage.getItem(KEY) as TiePreference | null;
  if (saved === 'default' || saved === 'external' || saved === 'internal') return saved;
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === 'true') return 'external';
  return 'default';
}

export const duplicateTiePreference = writable<TiePreference>(getInitial());

duplicateTiePreference.subscribe((v) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY, v);
  }
});
