import type { PersonResponseDto } from '@api';

export const searchNameLocal = (
  name: string,
  people: PersonResponseDto[],
  slice: number,
  personId?: string,
): PersonResponseDto[] => {
  return name.includes(' ')
    ? people
        .filter((person: PersonResponseDto) => {
          return personId
            ? person.name.toLowerCase().startsWith(name.toLowerCase()) && person.id !== personId
            : person.name.toLowerCase().startsWith(name.toLowerCase());
        })
        .slice(0, slice)
    : people
        .filter((person: PersonResponseDto) => {
          const nameParts = person.name.split(' ');
          return personId
            ? nameParts.some((splitName) => splitName.toLowerCase().startsWith(name.toLowerCase())) &&
                person.id !== personId
            : nameParts.some((splitName) => splitName.toLowerCase().startsWith(name.toLowerCase()));
        })
        .slice(0, slice);
};

export const getPersonNameWithHiddenValue = (name: string, isHidden: boolean) => {
  return `${name ? name + (isHidden ? ' ' : '') : ''}${isHidden ? '(hidden)' : ''}`;
};
