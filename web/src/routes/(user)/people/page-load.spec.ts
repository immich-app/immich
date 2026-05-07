const { authenticate, getFormatter } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getFormatter: vi.fn(),
}));

vi.mock('$lib/utils/auth', () => ({ authenticate }));
vi.mock('$lib/utils/i18n', () => ({ getFormatter }));

import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { load } from './+page';

describe('people page load', () => {
  const peopleResponse = {
    people: [],
    total: 12,
    hidden: 2,
    hasNextPage: false,
  };

  const statisticsResponse = {
    total: 12,
    hidden: 2,
    detectedFaceCount: 2901,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    getFormatter.mockResolvedValue((key: string) => key);
    sdkMock.getAllPeople.mockResolvedValue(peopleResponse);
    sdkMock.getPeopleStatistics.mockResolvedValue(statisticsResponse);
  });

  it('authenticates and loads people with overview statistics', async () => {
    const url = new URL('https://gallery.test/people');

    await expect(load({ url } as never)).resolves.toEqual({
      people: peopleResponse,
      peopleStatistics: statisticsResponse,
      meta: { title: 'people' },
    });

    expect(authenticate).toHaveBeenCalledWith(url);
    expect(sdkMock.getAllPeople).toHaveBeenCalledWith({ withHidden: true, withSharedSpaces: true });
    expect(sdkMock.getPeopleStatistics).toHaveBeenCalledWith({ withSharedSpaces: true });
    expect(sdkMock.getPeopleFaceStatistics).not.toHaveBeenCalled();
  });

  it('does not forward unsupported search parameters to overview statistics', async () => {
    const url = new URL('https://gallery.test/people?searchedPeople=Ali&closestPersonId=p1&closestAssetId=a1');

    await load({ url } as never);

    expect(sdkMock.getPeopleStatistics).toHaveBeenCalledWith({ withSharedSpaces: true });
  });

  it('keeps the people list when overview statistics fail', async () => {
    const url = new URL('https://gallery.test/people');
    sdkMock.getPeopleStatistics.mockRejectedValue(new Error('stats unavailable'));

    await expect(load({ url } as never)).resolves.toEqual({
      people: peopleResponse,
      peopleStatistics: null,
      meta: { title: 'people' },
    });
  });

  it('still rejects when the people list fails', async () => {
    const url = new URL('https://gallery.test/people');
    const error = new Error('people unavailable');
    sdkMock.getAllPeople.mockRejectedValue(error);

    await expect(load({ url } as never)).rejects.toThrow(error);
  });
});
