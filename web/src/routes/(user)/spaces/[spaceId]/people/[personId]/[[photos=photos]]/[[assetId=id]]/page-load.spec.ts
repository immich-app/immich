const { authenticate } = vi.hoisted(() => ({ authenticate: vi.fn() }));

vi.mock('$lib/utils/auth', () => ({ authenticate }));

import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { QueryParameter } from '$lib/constants';
import { load } from './+page';

describe('space person detail page load', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sdkMock.getSpace.mockResolvedValue({ id: 'space-1', name: 'Family' } as never);
    sdkMock.getMembers.mockResolvedValue([]);
    sdkMock.getSpacePerson.mockResolvedValue({ id: 'person-1', name: 'Alice', assetCount: 5, faceCount: 10 } as never);
    sdkMock.getSpacePersonStatistics.mockResolvedValue({ assets: 5, faces: 10 });
  });

  it('loads space person statistics for the selected space and person', async () => {
    const url = new URL('https://gallery.test/spaces/space-1/people/person-1');

    const result = await load({ params: { spaceId: 'space-1', personId: 'person-1' }, url } as never);

    expect(authenticate).toHaveBeenCalledWith(url);
    expect(sdkMock.getSpacePersonStatistics).toHaveBeenCalledWith({ id: 'space-1', personId: 'person-1' });
    expect(result.statistics).toEqual({ assets: 5, faces: 10 });
  });

  it('keeps safe previous route behavior unchanged', async () => {
    const url = new URL(
      `https://gallery.test/spaces/space-1/people/person-1?${QueryParameter.PREVIOUS_ROUTE}=/spaces/space-1/people`,
    );

    const result = await load({ params: { spaceId: 'space-1', personId: 'person-1' }, url } as never);

    expect(result.previousRoute).toBe('/spaces/space-1/people');
  });
});
