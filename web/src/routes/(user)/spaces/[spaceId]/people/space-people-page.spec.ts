import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { clearPeopleFaceStatisticsInfoCache } from '$lib/components/people/people-face-statistics-info-cache';
import { authManager } from '$lib/managers/auth-manager.svelte';
import {
  RepresentativeFaceSource,
  SharedSpaceRole,
  type SharedSpaceMemberResponseDto,
  type SharedSpacePeopleStatisticsResponseDto,
  type SharedSpacePersonResponseDto,
  type SharedSpaceResponseDto,
} from '@immich/sdk';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SpacePeoplePage from './+page.svelte';

const { gotoMock, pageStore, featureFlagsMock } = vi.hoisted(() => {
  let pageValue = {
    url: new URL('http://localhost/spaces/space-1/people'),
    route: { id: '/(user)/spaces/[spaceId]/people' },
  };

  return {
    gotoMock: vi.fn(),
    pageStore: {
      setUrl: (url: string) => {
        pageValue = { ...pageValue, url: new URL(url) };
      },
      subscribe: (run: (value: typeof pageValue) => void) => {
        run(pageValue);
        return () => {};
      },
    },
    featureFlagsMock: { value: { peopleStatistics: true } },
  };
});

vi.mock('$app/navigation', () => ({ goto: gotoMock }));
vi.mock('$app/stores', () => ({ page: pageStore }));
vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: featureFlagsMock,
}));

vi.mock('@immich/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@immich/ui')>();
  return {
    ...original,
    modalManager: { show: vi.fn(), showDialog: vi.fn() },
    toastManager: { primary: vi.fn(), success: vi.fn(), warning: vi.fn() },
  };
});

vi.mock('$lib/components/layouts/user-page-layout.svelte', async () => {
  const { default: MockComponent } = await import('$lib/components/spaces/mock-user-page-layout.test-wrapper.svelte');
  return { default: MockComponent };
});

function makeSpacePerson(overrides: Partial<SharedSpacePersonResponseDto> = {}): SharedSpacePersonResponseDto {
  return {
    id: 'space-person-1',
    spaceId: 'space-1',
    name: 'Alice',
    thumbnailPath: '',
    isHidden: false,
    birthDate: null,
    representativeFaceId: null,
    representativeFaceSource: RepresentativeFaceSource.Auto,
    faceCount: 1,
    assetCount: 4,
    alias: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    type: 'person',
    ...overrides,
  };
}

function renderPage(people: SharedSpacePersonResponseDto[], peopleStatistics?: SharedSpacePeopleStatisticsResponseDto) {
  peopleStatistics ??= {
    total: people.length,
    hidden: people.filter((person) => person.isHidden).length,
    detectedFaceCount: 0,
  };

  const space: SharedSpaceResponseDto = {
    id: 'space-1',
    name: 'Test Space',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ownerId: 'owner-user-id',
    createdById: 'owner-user-id',
    description: '',
    slug: null,
    isPublic: false,
    publicSlug: null,
    allowDownload: true,
    showMetadata: true,
    showExif: true,
    password: null,
    expiresAt: null,
    assets: [],
    albumId: null,
    assetCount: people.length,
    faceRecognitionEnabled: true,
    petsEnabled: true,
  } as SharedSpaceResponseDto;
  const members: SharedSpaceMemberResponseDto[] = [
    {
      userId: 'current-user-id',
      email: 'user@example.com',
      name: 'Current User',
      role: SharedSpaceRole.Editor,
      showInTimeline: false,
      sharePersonMetadata: true,
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  return render(SpacePeoplePage, {
    props: {
      data: {
        space,
        members,
        people,
        peopleStatistics,
        meta: { title: 'Test Space - People' },
      },
    },
  });
}

describe('Space people page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearPeopleFaceStatisticsInfoCache();
    authManager.setUser(userAdminFactory.build({ id: 'current-user-id' }));
    authManager.setPreferences(preferencesFactory.build());
    Element.prototype.animate = getAnimateMock();
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    pageStore.setUrl('http://localhost/spaces/space-1/people');
    gotoMock.mockResolvedValue(undefined);
    featureFlagsMock.value.peopleStatistics = true;
  });

  it('keeps a newly named person in the same visible position until the page is refreshed', async () => {
    const bob = makeSpacePerson({ id: 'space-person-bob', name: 'Bob' });
    const unnamed = makeSpacePerson({ id: 'space-person-unnamed', name: '' });
    const renamed = makeSpacePerson({ id: 'space-person-unnamed', name: 'Aaron' });
    sdkMock.updateSpacePerson.mockResolvedValue(renamed);
    sdkMock.getSpacePeople.mockResolvedValue([renamed, bob]);

    renderPage([bob, unnamed]);

    const user = userEvent.setup();
    const inputs = screen.getAllByPlaceholderText('add_a_name');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue('Bob');
    expect(inputs[1]).toHaveValue('');

    await user.click(inputs[1]);
    await user.type(inputs[1], 'Aaron');
    await fireEvent.focusOut(inputs[1]);

    await waitFor(() => {
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith({
        id: 'space-1',
        personId: 'space-person-unnamed',
        sharedSpacePersonUpdateDto: { name: 'Aaron' },
      });
    });
    expect(sdkMock.getSpacePeople).not.toHaveBeenCalled();

    const updatedInputs = screen.getAllByPlaceholderText('add_a_name');
    expect(updatedInputs[0]).toHaveValue('Bob');
    expect(updatedInputs[1]).toHaveValue('Aaron');
  });
});
