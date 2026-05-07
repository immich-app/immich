const { authenticate } = vi.hoisted(() => ({
  authenticate: vi.fn(),
}));

vi.mock('$lib/utils/auth', () => ({ authenticate }));

import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { SharedSpaceRole } from '@immich/sdk';
import { load } from './+page';

describe('space people page load', () => {
  const space = {
    id: 'space-1',
    name: 'Test Space',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdById: 'owner-user-id',
  };

  const members = [
    {
      userId: 'current-user-id',
      email: 'user@example.com',
      name: 'Current User',
      role: SharedSpaceRole.Editor,
      showInTimeline: false,
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const people = [
    {
      id: 'person-1',
      spaceId: 'space-1',
      name: 'Alice',
      thumbnailPath: '',
      isHidden: false,
      birthDate: null,
      representativeFaceId: null,
      representativeFaceSource: 'auto',
      faceCount: 3,
      assetCount: 4,
      alias: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      type: 'person',
    },
  ];

  const peopleStatistics = {
    total: 12,
    hidden: 2,
    detectedFaceCount: 1980,
  };

  const event = {
    url: new URL('https://gallery.test/spaces/space-1/people'),
    params: { spaceId: 'space-1' },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    sdkMock.getSpace.mockResolvedValue(space as never);
    sdkMock.getMembers.mockResolvedValue(members as never);
    sdkMock.getSpacePeople.mockResolvedValue(people as never);
    sdkMock.getSpacePeopleStatistics.mockResolvedValue(peopleStatistics);
  });

  it('authenticates and loads space people with overview statistics', async () => {
    await expect(load(event as never)).resolves.toEqual({
      space,
      members,
      people,
      peopleStatistics,
      meta: { title: 'Test Space - People' },
    });

    expect(authenticate).toHaveBeenCalledWith(event.url);
    expect(sdkMock.getSpace).toHaveBeenCalledWith({ id: 'space-1' });
    expect(sdkMock.getMembers).toHaveBeenCalledWith({ id: 'space-1' });
    expect(sdkMock.getSpacePeople).toHaveBeenCalledWith({ id: 'space-1', limit: 100 });
    expect(sdkMock.getSpacePeopleStatistics).toHaveBeenCalledWith({ id: 'space-1' });
    expect(sdkMock.getSpacePeopleFaceStatistics).not.toHaveBeenCalled();
  });

  it('keeps the space people list when overview statistics fail', async () => {
    sdkMock.getSpacePeopleStatistics.mockRejectedValue(new Error('stats unavailable'));

    await expect(load(event as never)).resolves.toEqual({
      space,
      members,
      people,
      peopleStatistics: null,
      meta: { title: 'Test Space - People' },
    });
  });

  it('still rejects when the people list fails', async () => {
    const error = new Error('people unavailable');
    sdkMock.getSpacePeople.mockRejectedValue(error);

    await expect(load(event as never)).rejects.toThrow(error);
  });
});
