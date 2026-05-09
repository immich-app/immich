import { sdkMock } from '$lib/__mocks__/sdk.mock';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { Type, type PersonResponseDto, type PersonStatisticsResponseDto } from '@immich/sdk';
import { modalManager } from '@immich/ui';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Component } from 'svelte';
import PersonDetailPage from './+page.svelte';

const {
  afterNavigateMock,
  featureFlagsMock,
  formatMessage,
  gotoMock,
  invalidateAllMock,
  mockAssetMultiSelectManager,
  mockPage,
} = vi.hoisted(() => {
  const formatCount = (count: unknown, singular: string, plural: string) => {
    const value = Number(count);
    return `${value.toLocaleString('en-US')} ${value === 1 ? singular : plural}`;
  };

  const formatMessage = (key: string, options?: { values?: Record<string, unknown> }) => {
    if (key === 'assets_count') {
      return formatCount(options?.values?.count, 'asset', 'assets');
    }

    if (key === 'faces_count') {
      return formatCount(options?.values?.count, 'face', 'faces');
    }

    return key;
  };

  return {
    afterNavigateMock: vi.fn(),
    featureFlagsMock: { value: { peopleStatistics: true } },
    formatMessage,
    gotoMock: vi.fn(),
    invalidateAllMock: vi.fn(),
    mockAssetMultiSelectManager: {
      selectionActive: false,
      assets: [],
      clear: vi.fn(),
      isAllUserOwned: true,
      isAllFavorite: false,
      isAllArchived: false,
    },
    mockPage: {
      url: new URL('https://gallery.test/people/person-1'),
      route: { id: '/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]' },
      params: { personId: 'person-1' },
    },
  };
});

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: featureFlagsMock,
}));

vi.mock('$app/navigation', () => ({
  afterNavigate: afterNavigateMock,
  goto: gotoMock,
  invalidateAll: invalidateAllMock,
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: (run: (value: typeof mockPage) => void) => {
      run(mockPage);
      return () => {};
    },
  },
  navigating: {
    subscribe: (run: (value: null) => void) => {
      run(null);
      return () => {};
    },
  },
}));

vi.mock('svelte-i18n', () => ({
  t: {
    subscribe: (run: (formatter: typeof formatMessage) => void) => {
      run(formatMessage);
      return () => {};
    },
  },
}));

vi.mock('$lib/managers/asset-multi-select-manager.svelte', () => ({
  assetMultiSelectManager: mockAssetMultiSelectManager,
}));

vi.mock('@immich/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@immich/ui')>();
  const { default: MockContextMenuButton } = await import('@test-data/mocks/action-context-menu.stub.svelte');
  return {
    ...original,
    ContextMenuButton: MockContextMenuButton,
    modalManager: { show: vi.fn(), showDialog: vi.fn() },
    toastManager: { primary: vi.fn(), success: vi.fn(), warning: vi.fn() },
  };
});

vi.mock('$lib/components/OnEvents.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/timeline/Timeline.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/bindable-timeline.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/assets/thumbnail/image-thumbnail.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/image-thumbnail.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/people/people-merge-selector.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/people-merge-selector.stub.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/modals/RepresentativeFacePickerModal.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

function makePerson(overrides: Partial<PersonResponseDto> = {}): PersonResponseDto {
  return {
    id: 'person-1',
    name: 'Alice',
    birthDate: null,
    thumbnailPath: '/thumb.jpg',
    isHidden: false,
    isFavorite: false,
    color: undefined,
    updatedAt: '2026-01-02T00:00:00.000Z',
    type: 'person',
    species: null,
    ...overrides,
  };
}

function renderPage({
  person = makePerson(),
  statistics = { assets: 5, faces: 6 },
}: {
  person?: PersonResponseDto;
  statistics?: PersonStatisticsResponseDto;
} = {}) {
  authManager.setUser(userAdminFactory.build({ id: 'current-user-id' }));
  authManager.setPreferences(preferencesFactory.build());

  const props = {
    data: {
      person,
      statistics,
      meta: { title: person.name || 'Person' },
    },
  };

  return render(TestWrapper as Component<{ component: typeof PersonDetailPage; componentProps: typeof props }>, {
    component: PersonDetailPage,
    componentProps: props,
  });
}

describe('Person detail page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    gotoMock.mockResolvedValue(undefined);
    invalidateAllMock.mockResolvedValue(undefined);
    mockAssetMultiSelectManager.selectionActive = false;
    mockAssetMultiSelectManager.assets = [];
    sdkMock.getPerson.mockResolvedValue(makePerson());
    featureFlagsMock.value.peopleStatistics = true;
  });

  it('uses same-person repair when merging a personal person with a space-primary candidate', async () => {
    renderPage();

    await userEvent.click(screen.getByText('merge_people'));
    await userEvent.click(screen.getByTestId('merge-space-candidate'));

    expect(sdkMock.mergeScopedPeople).toHaveBeenCalledWith({
      mergeScopedPeopleDto: {
        target: { type: 'person', id: 'person-1' },
        sources: [{ type: 'space-person', id: 'space-person-candidate', spaceId: 'space-2' }],
      },
    });
    expect(sdkMock.mergePerson).not.toHaveBeenCalled();
  });

  it('renders asset and face counts in the person header', () => {
    renderPage({
      person: makePerson({ name: 'Alice' }),
      statistics: { assets: 7, faces: 10 },
    });

    expect(screen.getByText('7 assets')).toBeInTheDocument();
    expect(screen.getByText('10 faces')).toBeInTheDocument();
  });

  it('hides the face count line when the peopleStatistics feature flag is disabled', () => {
    featureFlagsMock.value.peopleStatistics = false;
    renderPage({
      person: makePerson({ name: 'Alice' }),
      statistics: { assets: 7, faces: 10 },
    });

    expect(screen.getByText('7 assets')).toBeInTheDocument();
    expect(screen.queryByText('10 faces')).not.toBeInTheDocument();
  });

  it('keeps the page person as the repair target when a space candidate is promoted by auto-swap', async () => {
    renderPage({ person: makePerson({ name: '' }) });

    await userEvent.click(screen.getByText('merge_people'));
    await userEvent.click(screen.getByTestId('merge-swapped-space-candidate'));

    expect(sdkMock.mergeScopedPeople).toHaveBeenCalledWith({
      mergeScopedPeopleDto: {
        target: { type: 'person', id: 'person-1' },
        sources: [{ type: 'space-person', id: 'space-person-candidate', spaceId: 'space-2' }],
      },
    });
    expect(sdkMock.getPerson).toHaveBeenCalledWith({ id: 'person-1' });
  });

  it('routes swapped space candidates to their space-person detail page', async () => {
    renderPage();

    await userEvent.click(screen.getByText('merge_people'));
    await userEvent.click(screen.getByTestId('swap-space-candidate'));

    expect(gotoMock).toHaveBeenCalledWith(
      '/spaces/space-2/people/space-person-candidate?previousRoute=%2Fpeople&action=merge',
    );
  });

  it('searches merge candidates with shared spaces enabled', async () => {
    renderPage();

    await userEvent.click(screen.getByText('merge_people'));
    await userEvent.click(screen.getByTestId('search-merge-candidates'));

    expect(sdkMock.searchPerson).toHaveBeenCalledWith({ name: 'Alice', withHidden: true, withSharedSpaces: true });
  });

  it('loads the global person timeline with shared-space assets included', () => {
    renderPage();

    const options = JSON.parse(screen.getByTestId('timeline-stub').dataset.options ?? '{}');
    expect(options).toEqual(
      expect.objectContaining({
        personIds: ['person-1'],
        visibility: 'timeline',
        withSharedSpaces: true,
      }),
    );
  });

  it('uses the scoped person token for identity-wide shared-space timelines', () => {
    renderPage({
      person: makePerson({
        id: 'space-person-1',
        filterId: 'space-person:space-person-1',
        primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
      }),
    });

    const options = JSON.parse(screen.getByTestId('timeline-stub').dataset.options ?? '{}');
    expect(options).toEqual(
      expect.objectContaining({
        personIds: ['space-person:space-person-1'],
        visibility: 'timeline',
        withSharedSpaces: true,
      }),
    );
  });

  it('uses the shared-space thumbnail for a space-primary identity-wide person page', () => {
    renderPage({
      person: makePerson({
        id: 'space-person-1',
        filterId: 'space-person:space-person-1',
        primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
      }),
    });

    expect(screen.getByRole('img', { name: 'Alice' }).getAttribute('src')).toContain(
      '/shared-spaces/space-1/people/space-person-1/thumbnail?updatedAt=2026-01-02T00%3A00%3A00.000Z',
    );
  });

  it('opens the representative face picker from the person menu', async () => {
    renderPage();

    await userEvent.click(screen.getByText('select_representative_face'));

    expect(modalManager.show).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'select_representative_face',
        loadFaces: expect.any(Function),
        updateFace: expect.any(Function),
        canUpdate: true,
        getThumbnailUrl: expect.any(Function),
      }),
    );
  });

  it('uses exact-face SDK calls for personal representative selection', async () => {
    sdkMock.getPersonFaces.mockResolvedValue({ faces: [], hasNextPage: false });
    sdkMock.updateRepresentativeFace.mockResolvedValue(makePerson({ updatedAt: '2026-02-01T00:00:00.000Z' }));
    renderPage();

    await userEvent.click(screen.getByText('select_representative_face'));
    const props = vi.mocked(modalManager.show).mock.calls[0][1] as unknown as {
      loadFaces: (request: { page: number; size: number }) => Promise<unknown>;
      updateFace: (faceId: string) => Promise<unknown>;
    };

    await props.loadFaces({ page: 2, size: 50 });
    await props.updateFace('face-1');

    expect(sdkMock.getPersonFaces).toHaveBeenCalledWith({ id: 'person-1', page: 2, size: 50 });
    expect(sdkMock.updateRepresentativeFace).toHaveBeenCalledWith({
      id: 'person-1',
      representativeFaceUpdateDto: { assetFaceId: 'face-1' },
    });
  });

  it('does not enter timeline single-select mode for representative face picker', async () => {
    renderPage();

    await userEvent.click(screen.getByText('select_representative_face'));

    expect(modalManager.show).toHaveBeenCalled();
    expect(screen.getByTestId('timeline-stub')).not.toHaveAttribute('singleSelect');
    expect(screen.getByTestId('timeline-stub')).not.toHaveAttribute('isSelectionMode');
  });

  it('detaches the personal profile after confirmation', async () => {
    vi.mocked(modalManager.showDialog).mockResolvedValue(true);
    renderPage();

    await userEvent.click(screen.getByText('separate_from_grouped_person'));

    expect(sdkMock.detachScopedPerson).toHaveBeenCalledWith({
      detachScopedPersonDto: { profile: { type: 'person', id: 'person-1' } },
    });
    expect(invalidateAllMock).toHaveBeenCalled();
  });
});
