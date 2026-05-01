import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
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
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SpacePeoplePage from '../../../routes/(user)/spaces/[spaceId]/people/+page.svelte';

const { gotoMock } = vi.hoisted(() => ({ gotoMock: vi.fn() }));

vi.mock('$app/navigation', () => ({ goto: gotoMock }));

vi.mock('@immich/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@immich/ui')>();
  return {
    ...original,
    modalManager: { show: vi.fn(), showDialog: vi.fn() },
    toastManager: { primary: vi.fn(), success: vi.fn(), warning: vi.fn() },
  };
});

vi.mock('$lib/components/layouts/user-page-layout.svelte', async () => {
  const { default: MockComponent } = await import('./mock-user-page-layout.test-wrapper.svelte');
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
    name: 'John Doe',
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
  space = makeSpace(),
  members = [makeMember()],
  people = [makePerson()],
  userId = 'current-user-id',
}: {
  space?: SharedSpaceResponseDto;
  members?: SharedSpaceMemberResponseDto[];
  people?: SharedSpacePersonResponseDto[];
  userId?: string;
} = {}) {
  const currentUser = userAdminFactory.build({ id: userId });
  authManager.setUser(currentUser);
  authManager.setPreferences(preferencesFactory.build());

  return render(SpacePeoplePage, {
    props: {
      data: {
        space,
        members,
        people,
        meta: { title: `${space.name} - People` },
      },
    },
  });
}

describe('Spaces people page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
    gotoMock.mockResolvedValue(undefined);
    sdkMock.getSpacePeople.mockResolvedValue([]);
  });

  it('renders circular thumbnails for each person', async () => {
    let callback!: IntersectionObserverCallback;
    class VisibleObserver {
      observe = vi.fn((target: Element) => {
        callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      });
      disconnect = vi.fn();
      unobserve = vi.fn();
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
    }
    vi.stubGlobal('IntersectionObserver', VisibleObserver);
    const people = [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })];
    const { baseElement } = renderPage({ people });

    await waitFor(() => {
      const images = baseElement.querySelectorAll('img');
      const srcs = [...images].map((img) => img.getAttribute('src'));
      expect(srcs.some((s) => s?.includes('p1/thumbnail'))).toBe(true);
      expect(srcs.some((s) => s?.includes('p2/thumbnail'))).toBe(true);
    });

    vi.unstubAllGlobals();
  });

  it('shows inline name input for editors', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    renderPage({ people, members: [makeMember({ role: SharedSpaceRole.Editor })] });

    const nameInput = screen.getByDisplayValue('Alice');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.tagName).toBe('INPUT');
    expect(nameInput).toHaveAttribute('placeholder', 'add_a_name');
  });

  it('does NOT show name input for viewers', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    renderPage({ people, members: [makeMember({ role: SharedSpaceRole.Viewer })] });

    const nameInput = screen.queryByDisplayValue('Alice');
    expect(nameInput).toBeNull();

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows canonical name when alias is present', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice Johnson', alias: 'Mom' })];
    renderPage({ people, members: [makeMember({ role: SharedSpaceRole.Viewer })] });

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Mom')).not.toBeInTheDocument();
  });

  it('shows context menu button on hover for editors', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    const { baseElement } = renderPage({ people, members: [makeMember({ role: SharedSpaceRole.Editor })] });

    const card = baseElement.querySelector('[role="group"]')!;
    expect(card).toBeTruthy();

    await fireEvent.mouseEnter(card);

    const menuButton = screen.getByLabelText('show_person_options');
    expect(menuButton).toBeInTheDocument();
  });

  it('does NOT show context menu for viewers', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    const { baseElement } = renderPage({ people, members: [makeMember({ role: SharedSpaceRole.Viewer })] });

    const card = baseElement.querySelector('[role="group"]')!;
    await fireEvent.mouseEnter(card);

    expect(screen.queryByLabelText('show_person_options')).toBeNull();
  });

  it('context menu has "Merge" option', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    const { baseElement } = renderPage({ people, members: [makeMember({ role: SharedSpaceRole.Editor })] });

    const card = baseElement.querySelector('[role="group"]')!;
    await fireEvent.mouseEnter(card);

    const menuButton = screen.getByLabelText('show_person_options');
    const user = userEvent.setup();
    await user.click(menuButton);

    expect(screen.getByText('merge_people')).toBeInTheDocument();
    expect(screen.queryByText('spaces_set_alias')).not.toBeInTheDocument();
  });

  it('opens birthdate editing from spaces people management and saves through updateSpacePerson', async () => {
    const person = makePerson({ id: 'p1', name: 'Alice', birthDate: null });
    const updatedPerson = { ...person, birthDate: null };
    sdkMock.updateSpacePerson.mockResolvedValue(updatedPerson);
    const { baseElement } = renderPage({ people: [person], members: [makeMember({ role: SharedSpaceRole.Editor })] });

    await fireEvent.mouseEnter(baseElement.querySelector('[role="group"]')!);

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('show_person_options'));
    await user.click(screen.getByText('set_date_of_birth'));

    const modalProps = vi.mocked(modalManager.show).mock.calls[0][1] as unknown as {
      birthDate: string | null;
      onSave: (birthDate: string) => Promise<boolean>;
    };
    expect(modalProps.birthDate).toBeNull();

    await modalProps.onSave('1990-06-15');

    expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith({
      id: 'space-1',
      personId: 'p1',
      sharedSpacePersonUpdateDto: { birthDate: '1990-06-15' },
    });

    await fireEvent.mouseEnter(baseElement.querySelector('[role="group"]')!);
    await user.click(screen.getByLabelText('show_person_options'));
    await user.click(screen.getByText('set_date_of_birth'));

    const reopenedModalProps = vi.mocked(modalManager.show).mock.calls[1][1] as unknown as {
      birthDate: string | null;
    };
    expect(reopenedModalProps.birthDate).toBe('1990-06-15');
  });

  it('opens the shared merge flow in-place instead of navigating to the old detail merge route', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })];
    sdkMock.getSpacePeople.mockResolvedValue(people);
    const { baseElement } = renderPage({ people, members: [makeMember({ role: SharedSpaceRole.Editor })] });

    await fireEvent.mouseEnter(baseElement.querySelector('[role="group"]')!);

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('show_person_options'));
    await user.click(screen.getByText('merge_people'));

    await waitFor(() => {
      expect(sdkMock.getSpacePeople).toHaveBeenCalledWith({ id: 'space-1', limit: 100 });
    });
    expect(gotoMock).not.toHaveBeenCalledWith('/spaces/space-1/people/p1?action=merge');
    expect(screen.getByText('choose_matching_people_to_merge')).toBeInTheDocument();
  });

  it('merges selected space people into the current person like the global merge flow', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })];
    sdkMock.getSpacePeople.mockResolvedValue(people);
    sdkMock.mergeSpacePeople.mockResolvedValue(undefined as never);
    vi.mocked(modalManager.showDialog).mockResolvedValue(true);
    const { baseElement } = renderPage({ people, members: [makeMember({ role: SharedSpaceRole.Editor })] });

    await fireEvent.mouseEnter(baseElement.querySelector('[role="group"]')!);

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('show_person_options'));
    await user.click(screen.getByText('merge_people'));
    await screen.findByText('choose_matching_people_to_merge');
    await user.click(screen.getByRole('button', { name: 'Bob' }));
    await user.click(screen.getByRole('button', { name: 'merge' }));

    await waitFor(() => {
      expect(sdkMock.mergeSpacePeople).toHaveBeenCalledWith({
        id: 'space-1',
        personId: 'p1',
        sharedSpacePersonMergeDto: { ids: ['p2'] },
      });
    });
  });

  it('name editing calls updateSpacePerson API on blur', async () => {
    const person = makePerson({ id: 'p1', name: 'Alice' });
    sdkMock.updateSpacePerson.mockResolvedValue(person);
    sdkMock.getSpacePeople.mockResolvedValue([person]);

    renderPage({ people: [person], members: [makeMember({ role: SharedSpaceRole.Editor })] });

    const nameInput = screen.getByDisplayValue('Alice');
    const user = userEvent.setup();

    await user.click(nameInput);
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice Smith');
    await fireEvent.focusOut(nameInput);

    await waitFor(() => {
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'space-1',
          personId: 'p1',
          sharedSpacePersonUpdateDto: { name: 'Alice Smith' },
        }),
      );
    });
  });

  it('edits canonical name when alias is present', async () => {
    const person = makePerson({ id: 'p1', name: 'Alice Johnson', alias: 'Mom' });
    sdkMock.updateSpacePerson.mockResolvedValue(person);
    sdkMock.getSpacePeople.mockResolvedValue([person]);

    renderPage({ people: [person], members: [makeMember({ role: SharedSpaceRole.Editor })] });

    const nameInput = screen.getByDisplayValue('Alice Johnson');
    const user = userEvent.setup();

    await user.click(nameInput);
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice Smith');
    await fireEvent.focusOut(nameInput);

    await waitFor(() => {
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'space-1',
          personId: 'p1',
          sharedSpacePersonUpdateDto: { name: 'Alice Smith' },
        }),
      );
    });
  });

  it('does not call API when name is unchanged', async () => {
    const person = makePerson({ id: 'p1', name: 'Alice' });
    renderPage({ people: [person], members: [makeMember({ role: SharedSpaceRole.Editor })] });

    const nameInput = screen.getByDisplayValue('Alice');
    await fireEvent.focusIn(nameInput);
    await fireEvent.focusOut(nameInput);

    expect(sdkMock.updateSpacePerson).not.toHaveBeenCalled();
  });

  it('empty state shows when no people', () => {
    renderPage({ people: [] });

    expect(screen.getByText('spaces_no_people')).toBeInTheDocument();
    expect(screen.getByText('spaces_no_people_description')).toBeInTheDocument();
  });

  it('back button is present', () => {
    renderPage();

    const backButton = screen.getByLabelText('back');
    expect(backButton).toBeInTheDocument();
  });

  it('renders multiple person cards', () => {
    const people = [
      makePerson({ id: 'p1', name: 'Alice' }),
      makePerson({ id: 'p2', name: 'Bob' }),
      makePerson({ id: 'p3', name: 'Charlie' }),
    ];
    renderPage({ people, members: [makeMember({ role: SharedSpaceRole.Editor })] });

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument();
  });

  it('links each person thumbnail to their detail page', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    const { baseElement } = renderPage({ people });

    const link = baseElement.querySelector('a[href="/spaces/space-1/people/p1"]');
    expect(link).toBeTruthy();
  });
});
