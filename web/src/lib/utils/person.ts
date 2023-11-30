import type { PersonResponseDto } from '@api';

export const searchNameLocal = (
  name: string,
  people: PersonResponseDto[],
  slice: number,
  personId?: string,
): PersonResponseDto[] => {
  return name.indexOf(' ') >= 0
    ? people
        .filter((person: PersonResponseDto) => {
          if (personId) {
            return person.name.toLowerCase().startsWith(name.toLowerCase()) && person.id !== personId;
          } else {
            return person.name.toLowerCase().startsWith(name.toLowerCase());
          }
        })
        .slice(0, slice)
    : people
        .filter((person: PersonResponseDto) => {
          const nameParts = person.name.split(' ');
          if (personId) {
            return (
              nameParts.some((splitName) => splitName.toLowerCase().startsWith(name.toLowerCase())) &&
              person.id !== personId
            );
          } else {
            return nameParts.some((splitName) => splitName.toLowerCase().startsWith(name.toLowerCase()));
          }
        })
        .slice(0, slice);
};
