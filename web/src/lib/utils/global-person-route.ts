import { Route } from '$lib/route';
import { createUrl, getPeopleThumbnailUrl } from '$lib/utils';
import { Type, type PersonResponseDto } from '@immich/sdk';

const getPrimaryProfileId = (person: Pick<PersonResponseDto, 'id' | 'primaryProfile'>) =>
  person.primaryProfile?.id ?? person.id;

export const getGlobalPersonHref = (person: Pick<PersonResponseDto, 'id' | 'primaryProfile'>, previousRoute?: string) =>
  Route.viewPerson({ id: getPrimaryProfileId(person) }, previousRoute ? { previousRoute } : undefined);

export const getGlobalPersonThumbnailUrl = (person: Pick<PersonResponseDto, 'id' | 'primaryProfile' | 'updatedAt'>) => {
  const profile = person.primaryProfile;
  if (profile?.type === Type.SpacePerson && profile.spaceId) {
    return createUrl(`/shared-spaces/${profile.spaceId}/people/${profile.id}/thumbnail`, {
      updatedAt: person.updatedAt,
    });
  }

  return getPeopleThumbnailUrl({ ...person, id: getPrimaryProfileId(person) } as PersonResponseDto);
};
