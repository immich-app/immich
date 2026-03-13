import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { preferences as preferencesStore, user as userStore } from '$lib/stores/user.store';
import {
  Role,
  type SharedSpaceMemberResponseDto,
  type SharedSpacePersonResponseDto,
  type SharedSpaceResponseDto,
} from '@immich/sdk';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SpacePeoplePage from '../../../routes/(user)/spaces/[spaceId]/people/+page.svelte';

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
    role: Role.Editor,
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
  userStore.set(currentUser);
  preferencesStore.set(preferencesFactory.build());

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
    sdkMock.getSpacePeople.mockResolvedValue([]);
  });

  it('renders circular thumbnails for each person', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })];
    const { baseElement } = renderPage({ people });

    const images = baseElement.querySelectorAll('img');
    const srcs = [...images].map((img) => img.getAttribute('src'));
    expect(srcs.some((s) => s?.includes('p1/thumbnail'))).toBe(true);
    expect(srcs.some((s) => s?.includes('p2/thumbnail'))).toBe(true);
  });

  it('shows inline name input for editors', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    renderPage({ people, members: [makeMember({ role: Role.Editor })] });

    const nameInput = screen.getByDisplayValue('Alice');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.tagName).toBe('INPUT');
    expect(nameInput).toHaveAttribute('placeholder', 'add_a_name');
  });

  it('does NOT show name input for viewers', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    renderPage({ people, members: [makeMember({ role: Role.Viewer })] });

    const nameInput = screen.queryByDisplayValue('Alice');
    expect(nameInput).toBeNull();

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows context menu button on hover for editors', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    const { baseElement } = renderPage({ people, members: [makeMember({ role: Role.Editor })] });

    const card = baseElement.querySelector('[role="group"]')!;
    expect(card).toBeTruthy();

    await fireEvent.mouseEnter(card);

    const menuButton = screen.getByLabelText('show_person_options');
    expect(menuButton).toBeInTheDocument();
  });

  it('does NOT show context menu for viewers', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    const { baseElement } = renderPage({ people, members: [makeMember({ role: Role.Viewer })] });

    const card = baseElement.querySelector('[role="group"]')!;
    await fireEvent.mouseEnter(card);

    expect(screen.queryByLabelText('show_person_options')).toBeNull();
  });

  it('context menu has "Merge" option', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    const { baseElement } = renderPage({ people, members: [makeMember({ role: Role.Editor })] });

    const card = baseElement.querySelector('[role="group"]')!;
    await fireEvent.mouseEnter(card);

    const menuButton = screen.getByLabelText('show_person_options');
    const user = userEvent.setup();
    await user.click(menuButton);

    expect(screen.getByText('merge_people')).toBeInTheDocument();
  });

  it('name editing calls updateSpacePerson API on blur', async () => {
    const person = makePerson({ id: 'p1', name: 'Alice' });
    sdkMock.updateSpacePerson.mockResolvedValue(person);
    sdkMock.getSpacePeople.mockResolvedValue([person]);

    renderPage({ people: [person], members: [makeMember({ role: Role.Editor })] });

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

  it('does not call API when name is unchanged', async () => {
    const person = makePerson({ id: 'p1', name: 'Alice' });
    renderPage({ people: [person], members: [makeMember({ role: Role.Editor })] });

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
    renderPage({ people, members: [makeMember({ role: Role.Editor })] });

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
