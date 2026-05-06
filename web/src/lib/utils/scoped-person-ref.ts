import { Type2 as ScopedPersonProfileType, type PersonResponseDto, type ScopedPersonProfileRefDto } from '@immich/sdk';

export const toScopedPersonRef = (person: PersonResponseDto): ScopedPersonProfileRefDto => {
  if (person.primaryProfile?.type === 'space-person' && person.primaryProfile.spaceId) {
    return {
      type: ScopedPersonProfileType.SpacePerson,
      id: person.primaryProfile.id,
      spaceId: person.primaryProfile.spaceId,
    };
  }

  if (person.primaryProfile?.type === 'user-person') {
    return { type: ScopedPersonProfileType.Person, id: person.primaryProfile.id };
  }

  return { type: ScopedPersonProfileType.Person, id: person.id };
};

export const isSpaceScopedPerson = (person: PersonResponseDto) =>
  toScopedPersonRef(person).type === ScopedPersonProfileType.SpacePerson;
