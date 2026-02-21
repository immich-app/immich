/**
 * Current (optional) rule: keep by source.
 * To add more rules later, extend `PreferenceItem` with new
 * `{ variant: 'x'; priority: string[] }` types.
 * `undefined` = no saved preference (fallback to default).
 */
export type SourcePreference = { variant: 'source'; priority: 'internal' | 'external' };

export type DuplicateTiePreferencesSvelte = PreferenceDuplicateTieItem[];

export type PreferenceDuplicateTieItem = SourcePreference;

export const duplicateTiePreference = $state<{
  value: DuplicateTiePreferencesSvelte | undefined;
}>({ value: undefined });

export const findDuplicateTiePreference = <T extends PreferenceDuplicateTieItem['variant']>(
  preference: DuplicateTiePreferencesSvelte | undefined,
  variant: T,
) => preference?.find((preference) => preference.variant === variant);

export function setDuplicateTiePreference(nextDuplicateTiePreferences: DuplicateTiePreferencesSvelte | undefined) {
  duplicateTiePreference.value = nextDuplicateTiePreferences;
}
