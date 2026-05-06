import { Type, type PersonResponseDto } from '@immich/sdk';
import { getGlobalPersonHref, getGlobalPersonThumbnailUrl } from './global-person-route';

const person = (overrides: Partial<PersonResponseDto> = {}): PersonResponseDto =>
  ({
    id: 'identity-row',
    name: 'Shared Person',
    updatedAt: '2026-01-02T00:00:00.000Z',
    isHidden: false,
    ...overrides,
  }) as PersonResponseDto;

describe('global person route helpers', () => {
  it('uses the viewer person profile for user-primary rows', () => {
    const row = person({ primaryProfile: { type: Type.UserPerson, id: 'user-person-1' } });

    expect(getGlobalPersonHref(row, '/people')).toBe('/people/user-person-1?previousRoute=%2Fpeople');
    expect(getGlobalPersonThumbnailUrl(row)).toBe(
      '/api/people/user-person-1/thumbnail?updatedAt=2026-01-02T00%3A00%3A00.000Z',
    );
  });

  it('routes space-primary global rows to identity-wide person detail', () => {
    const row = person({ primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' } });

    expect(getGlobalPersonHref(row, '/explore')).toBe('/people/space-person-1?previousRoute=%2Fexplore');
  });

  it('uses accessible shared-space thumbnail endpoint for space-primary rows', () => {
    const row = person({ primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' } });

    expect(getGlobalPersonThumbnailUrl(row)).toBe(
      '/api/shared-spaces/space-1/people/space-person-1/thumbnail?updatedAt=2026-01-02T00%3A00%3A00.000Z',
    );
  });
});
