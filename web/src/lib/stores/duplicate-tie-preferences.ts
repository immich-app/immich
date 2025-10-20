import { writable } from 'svelte/store';

/**
 * Current (optional) rule: keep by source.
 * To add more rules later, extend `PreferenceItem` with new
 * `{ variant: 'x'; priority: string[] }` types.
 * `undefined` = no saved preference (fallback to default).
 */
export type SourcePreference = { variant: 'source'; priority: 'internal' | 'external' };

export type PreferenceItem = SourcePreference;

export type DuplicateTiePreferences = PreferenceItem[];
export const duplicateTiePreference = writable<DuplicateTiePreferences | undefined>(undefined);

export const findDuplicateTiePreference = <T extends PreferenceItem['variant']>(
  preference: DuplicateTiePreferences | undefined,
  variant: T,
): Extract<PreferenceItem, { variant: T }> | undefined =>
  preference?.find(
    (preference): preference is Extract<PreferenceItem, { variant: T }> => preference.variant === variant,
  );
