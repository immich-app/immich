/**
 * Current (optional) rule: keep by source.
 * To add more rules later, extend `PreferenceItem` with new
 * `{ variant: 'x'; priority: string[] }` types.
 * `undefined` = no saved preference (fallback to default).
 */
export type SourcePreference = { variant: 'source'; priority: 'internal' | 'external' };

export type DuplicateTiePreferencesSvelte = PreferenceDuplicateTieItem[];

export type PreferenceDuplicateTieItem = SourcePreference;

export let duplicateTiePreference = $state<{
  value: DuplicateTiePreferencesSvelte | undefined;
}>({value: undefined});

export const findDuplicateTiePreference = <T extends PreferenceDuplicateTieItem['variant']>(
  preference: DuplicateTiePreferencesSvelte | undefined,
  variant: T,
): Extract<PreferenceDuplicateTieItem, { variant: T }> | undefined =>
  preference?.find(
    (preference): preference is Extract<PreferenceDuplicateTieItem, { variant: T }> => preference.variant === variant,
  );

export function setDuplicateTiePreference(nextDuplicateTiePreferences: DuplicateTiePreferencesSvelte | undefined): void {
  duplicateTiePreference.value = nextDuplicateTiePreferences;
}
