import type { PersonResponseDto } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { derived } from 'svelte/store';
import { normalizeSearchString } from './string-utils';

export const searchNameLocal = (
  name: string,
  people: PersonResponseDto[],
  slice: number,
  personId?: string,
): PersonResponseDto[] => {
  const normalizedName = normalizeSearchString(name);
  return name.includes(' ')
    ? people
        .filter((person: PersonResponseDto) => {
          const personName = person.name ?? '';
          return personId
            ? normalizeSearchString(personName).startsWith(normalizedName) && person.id !== personId
            : normalizeSearchString(personName).startsWith(normalizedName);
        })
        .slice(0, slice)
    : people
        .filter((person: PersonResponseDto) => {
          const nameParts = (person.name ?? '').split(' ');
          return personId
            ? nameParts.some((splitName) => normalizeSearchString(splitName).startsWith(normalizedName)) &&
                person.id !== personId
            : nameParts.some((splitName) => normalizeSearchString(splitName).startsWith(normalizedName));
        })
        .slice(0, slice);
};

export const getPersonNameWithHiddenValue = derived(t, ($t) => {
  return (name: string | null, isHidden: boolean) =>
    $t('person_hidden', { values: { name: name ?? '', hidden: isHidden } });
});
