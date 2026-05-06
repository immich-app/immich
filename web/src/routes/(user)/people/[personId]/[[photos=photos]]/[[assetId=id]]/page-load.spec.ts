const { authenticate, getFormatter } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getFormatter: vi.fn(),
}));

vi.mock('$lib/utils/auth', () => ({ authenticate }));
vi.mock('$lib/utils/i18n', () => ({ getFormatter }));

import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { Type, type PersonResponseDto } from '@immich/sdk';
import { load } from './+page';

const makePerson = (overrides: Partial<PersonResponseDto> = {}): PersonResponseDto => ({
  id: 'person-1',
  name: 'Alice',
  birthDate: null,
  thumbnailPath: '',
  isHidden: false,
  isFavorite: false,
  updatedAt: '2026-01-02T00:00:00.000Z',
  type: 'person',
  species: null,
  ...overrides,
});

describe('person detail page load', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getFormatter.mockResolvedValue((key: string) => key);
  });

  it('uses the identity-wide asset count when the person response provides it', async () => {
    const url = new URL('https://gallery.test/people/space-person-1');
    sdkMock.getPerson.mockResolvedValue(
      makePerson({
        id: 'space-person-1',
        numberOfAssets: 7,
        filterId: 'space-person:space-person-1',
        primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
      }),
    );

    const result = await load({ params: { personId: 'space-person-1' }, url } as never);

    expect(authenticate).toHaveBeenCalledWith(url);
    expect(sdkMock.getPerson).toHaveBeenCalledWith({ id: 'space-person-1' });
    expect(sdkMock.getPersonStatistics).not.toHaveBeenCalled();
    expect(result.statistics).toEqual({ assets: 7 });
  });

  it('falls back to personal person statistics for legacy person responses', async () => {
    const url = new URL('https://gallery.test/people/person-1');
    sdkMock.getPerson.mockResolvedValue(makePerson());
    sdkMock.getPersonStatistics.mockResolvedValue({ assets: 5 });

    const result = await load({ params: { personId: 'person-1' }, url } as never);

    expect(sdkMock.getPersonStatistics).toHaveBeenCalledWith({ id: 'person-1' });
    expect(result.statistics).toEqual({ assets: 5 });
  });
});
