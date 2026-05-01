import { sdkMock } from '$lib/__mocks__/sdk.mock';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import {
  SharedSpaceRole,
  type SharedSpaceMemberResponseDto,
  type SharedSpacePersonResponseDto,
  type SharedSpaceResponseDto,
} from '@immich/sdk';
import { modalManager } from '@immich/ui';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Component } from 'svelte';
import { load } from './+page';
import SpacePersonDetailPage from './+page.svelte';

const { gotoMock, invalidateAllMock, authenticateMock, mockAssetMultiSelectManager } = vi.hoisted(() => ({
  gotoMock: vi.fn(),
  invalidateAllMock: vi.fn(),
  authenticateMock: vi.fn(),
  mockAssetMultiSelectManager: {
    selectionActive: false,
    assets: [],
    clear: vi.fn(),
    isAllUserOwned: true,
    isAllFavorite: false,
    isAllArchived: false,
  },
}));

vi.mock('$app/navigation', () => ({ goto: gotoMock, invalidateAll: invalidateAllMock }));
vi.mock('$lib/utils/auth', () => ({ authenticate: authenticateMock }));
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
    toastManager: { primary: vi.fn(), success: vi.fn() },
  };
});

vi.mock('$lib/components/timeline/Timeline.svelte', async () => {
  const { default: MockComponent } = await import('./mock-space-person-timeline.test-wrapper.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/assets/thumbnail/image-thumbnail.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

vi.mock('$lib/components/people/people-merge-selector.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/people-merge-selector.stub.svelte');
  return { default: MockComponent };
});

function makeSpace(overrides: Partial<SharedSpaceResponseDto> = {}): SharedSpaceResponseDto {
  return {
    id: 'space-1',
    name: 'Test Space',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdById: 'owner-user-id',
    ...overrides,
  } as SharedSpaceResponseDto;
}

function makeMember(overrides: Partial<SharedSpaceMemberResponseDto> = {}): SharedSpaceMemberResponseDto {
  return {
    userId: 'current-user-id',
    email: 'user@example.com',
    name: 'Current User',
    role: SharedSpaceRole.Editor,
    showInTimeline: false,
    joinedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as SharedSpaceMemberResponseDto;
}

function makePerson(overrides: Partial<SharedSpacePersonResponseDto> = {}): SharedSpacePersonResponseDto {
  return {
    id: 'person-1',
    name: 'Alice',
    alias: null,
    assetCount: 5,
    faceCount: 10,
    isHidden: false,
    birthDate: null,
    thumbnailPath: '/thumb.jpg',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    spaceId: 'space-1',
    ...overrides,
  } as SharedSpacePersonResponseDto;
}

function renderPage({
  members = [makeMember()],
  person = makePerson(),
  action = null,
}: {
  members?: SharedSpaceMemberResponseDto[];
  person?: SharedSpacePersonResponseDto;
  action?: string | null;
} = {}) {
  const currentUser = userAdminFactory.build({ id: 'current-user-id' });
  authManager.setUser(currentUser);
  authManager.setPreferences(preferencesFactory.build());

  const props = {
    data: {
      space: makeSpace(),
      members,
      person,
      action,
      meta: { title: 'Alice - Test Space' },
    },
  };

  return render(TestWrapper as Component<{ component: typeof SpacePersonDetailPage; componentProps: typeof props }>, {
    component: SpacePersonDetailPage,
    componentProps: props,
  });
}

describe('Spaces person detail page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    gotoMock.mockResolvedValue(undefined);
    invalidateAllMock.mockResolvedValue(undefined);
    authenticateMock.mockResolvedValue(undefined);
    mockAssetMultiSelectManager.selectionActive = false;
    mockAssetMultiSelectManager.assets = [];
  });

  it('loads person metadata without fetching a separate asset id grid', async () => {
    const space = makeSpace();
    const members = [makeMember()];
    const person = makePerson();
    sdkMock.getSpace.mockResolvedValue(space);
    sdkMock.getMembers.mockResolvedValue(members);
    sdkMock.getSpacePerson.mockResolvedValue(person);

    const result = await load({
      url: new URL('https://gallery.test/spaces/space-1/people/person-1'),
      params: { spaceId: 'space-1', personId: 'person-1' },
    } as never);

    expect(result).toMatchObject({ space, members, person, action: null });
    expect(sdkMock.getSpacePersonAssets).not.toHaveBeenCalled();
  });

  it('uses the shared timeline surface for space person photos', () => {
    renderPage();

    expect(screen.getByTestId('space-person-timeline')).toHaveAttribute('data-enable-routing', 'true');
    expect(screen.getByTestId('space-person-timeline')).toHaveAttribute('data-space-id', 'space-1');
    expect(JSON.parse(screen.getByTestId('timeline-options').textContent ?? '{}')).toEqual({
      spaceId: 'space-1',
      spacePersonId: 'person-1',
      withStacked: true,
    });
    expect(screen.queryByTestId('person-asset-asset-1')).not.toBeInTheDocument();
  });

  it('does not expose person actions to viewers', () => {
    renderPage({ members: [makeMember({ role: SharedSpaceRole.Viewer })] });

    expect(screen.queryByLabelText('show_person_options')).not.toBeInTheDocument();
    expect(screen.queryByText('set_date_of_birth')).not.toBeInTheDocument();
    expect(screen.queryByText('merge_people')).not.toBeInTheDocument();
  });

  it('ignores a forced merge action for viewers', () => {
    renderPage({ members: [makeMember({ role: SharedSpaceRole.Viewer })], action: 'merge' });

    expect(screen.queryByTestId('people-merge-selector')).not.toBeInTheDocument();
  });

  it('opens the shared merge flow for editors', () => {
    renderPage({ action: 'merge' });

    expect(screen.getByTestId('people-merge-selector')).toHaveAttribute('data-person-id', 'person-1');
  });

  it('edits the space person name from the detail header', async () => {
    const person = makePerson({ name: '' });
    sdkMock.updateSpacePerson.mockResolvedValue({ ...person, name: 'Alice' });
    renderPage({ person });

    await userEvent.click(screen.getByText('add_a_name'));
    const input = screen.getByPlaceholderText('add_a_name');
    await userEvent.type(input, 'Alice');
    await userEvent.keyboard('{Enter}');

    expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith({
      id: 'space-1',
      personId: 'person-1',
      sharedSpacePersonUpdateDto: { name: 'Alice' },
    });
    expect(await screen.findByText('Alice')).toBeInTheDocument();
  });

  it('shows matching named space people while editing an unnamed person', async () => {
    const person = makePerson({ id: 'person-1', name: '' });
    const existingPerson = makePerson({ id: 'person-2', name: 'Alice Existing' });
    sdkMock.getSpacePeople.mockResolvedValue([existingPerson]);
    renderPage({ person });

    await userEvent.click(screen.getByText('add_a_name'));
    await userEvent.type(screen.getByPlaceholderText('add_a_name'), 'Ali');

    await waitFor(() => {
      expect(sdkMock.getSpacePeople).toHaveBeenCalledWith(
        { id: 'space-1', name: 'Ali', named: true, limit: 5 },
        expect.any(Object),
      );
    });
    expect(await screen.findByRole('button', { name: 'Alice Existing' })).toBeInTheDocument();
  });

  it('updates birthdate from the detail page and reopens with the saved value', async () => {
    const person = makePerson({ birthDate: null });
    sdkMock.updateSpacePerson.mockResolvedValue({ ...person, birthDate: null });
    renderPage({ person });

    await userEvent.click(screen.getByText('set_date_of_birth'));
    const modalProps = vi.mocked(modalManager.show).mock.calls[0][1] as unknown as {
      birthDate: string | null;
      onSave: (birthDate: string) => Promise<boolean>;
    };
    expect(modalProps.birthDate).toBeNull();

    await modalProps.onSave('1990-06-15');

    expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith({
      id: 'space-1',
      personId: 'person-1',
      sharedSpacePersonUpdateDto: { birthDate: '1990-06-15' },
    });
    expect(invalidateAllMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('set_date_of_birth'));
    const reopenedModalProps = vi.mocked(modalManager.show).mock.calls[1][1] as unknown as {
      birthDate: string | null;
    };
    expect(reopenedModalProps.birthDate).toBe('1990-06-15');
  });

  it('hides a space person from the detail page action menu', async () => {
    const person = makePerson({ isHidden: false });
    sdkMock.updateSpacePerson.mockResolvedValue({ ...person, isHidden: true });
    renderPage({ person });

    await userEvent.click(screen.getByText('hide_person'));

    expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith({
      id: 'space-1',
      personId: 'person-1',
      sharedSpacePersonUpdateDto: { isHidden: true },
    });
    expect(gotoMock).toHaveBeenCalledWith('/spaces/space-1/people');
  });
});
