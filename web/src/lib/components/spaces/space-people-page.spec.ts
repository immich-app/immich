import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { clearPeopleFaceStatisticsInfoCache } from '$lib/components/people/people-face-statistics-info-cache';
import { authManager } from '$lib/managers/auth-manager.svelte';
import {
  SharedSpaceRole,
  type PeopleFaceStatisticsResponseDto,
  type SharedSpaceMemberResponseDto,
  type SharedSpacePeopleStatisticsResponseDto,
  type SharedSpacePersonResponseDto,
  type SharedSpaceResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SpacePeoplePage from '../../../routes/(user)/spaces/[spaceId]/people/+page.svelte';

const { gotoMock, pageStore } = vi.hoisted(() => {
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
  };
});

vi.mock('$app/navigation', () => ({ goto: gotoMock }));
vi.mock('$app/stores', () => ({ page: pageStore }));

vi.mock('@immich/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@immich/ui')>();
  return {
    ...original,
    modalManager: { show: vi.fn(), showDialog: vi.fn() },
    toastManager: { danger: vi.fn(), primary: vi.fn(), success: vi.fn(), warning: vi.fn() },
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

function makeFaceStatistics(overrides: Partial<PeopleFaceStatisticsResponseDto> = {}): PeopleFaceStatisticsResponseDto {
  return {
    assignedHiddenFaceCount: 3456,
    assignedVisibleFaceCount: 2345,
    detectedFaceCount: 1234,
    unassignedFaceCount: 4567,
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function renderPage({
  space = makeSpace(),
  members = [makeMember()],
  people = [makePerson()],
  peopleStatistics = {
    total: people.length,
    hidden: people.filter((person) => person.isHidden).length,
    detectedFaceCount: 0,
  },
  userId = 'current-user-id',
}: {
  space?: SharedSpaceResponseDto;
  members?: SharedSpaceMemberResponseDto[];
  people?: SharedSpacePersonResponseDto[];
  peopleStatistics?: SharedSpacePeopleStatisticsResponseDto | null;
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
        peopleStatistics,
        meta: { title: `${space.name} - People` },
      },
    },
  });
}

describe('Spaces people page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearPeopleFaceStatisticsInfoCache();
    Element.prototype.animate = getAnimateMock();
    gotoMock.mockResolvedValue(undefined);
    pageStore.setUrl('http://localhost/spaces/space-1/people');
    sdkMock.getSpacePeople.mockResolvedValue([]);
    sdkMock.getSpacePeopleStatistics.mockResolvedValue({ total: 0, hidden: 0, detectedFaceCount: 0 });
    sdkMock.getSpacePeopleFaceStatistics.mockResolvedValue(makeFaceStatistics());
  });

  it('shows the visible person count and detected face count next to the heading', () => {
    renderPage({
      people: [makePerson({ id: 'p1' })],
      peopleStatistics: { total: 12, hidden: 2, detectedFaceCount: 1980 },
    });

    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(10) \u00B7 1,980 faces');
  });

  it('derives the heading person count from overview statistics instead of loaded rows', () => {
    renderPage({
      people: [makePerson({ id: 'p1' })],
      peopleStatistics: { total: 60, hidden: 4, detectedFaceCount: 100 },
    });

    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(56) \u00B7 100 faces');
  });

  it('shows detected faces when all space people are hidden', () => {
    renderPage({
      people: [makePerson({ id: 'p1', isHidden: true })],
      peopleStatistics: { total: 1, hidden: 1, detectedFaceCount: 42 },
    });

    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(0) \u00B7 42 faces');
  });

  it('omits the heading description for an empty scope with no detected faces', () => {
    renderPage({
      people: [],
      peopleStatistics: { total: 0, hidden: 0, detectedFaceCount: 0 },
    });

    expect(screen.getByTestId('user-page-layout')).not.toHaveAttribute('data-description');
  });

  it('keeps loaded people and controls when overview statistics are unavailable', () => {
    renderPage({
      people: [makePerson({ id: 'p1', name: 'Alice' })],
      peopleStatistics: null,
      members: [makeMember({ role: SharedSpaceRole.Editor })],
    });

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('search_people')).toBeInTheDocument();
    expect(screen.getByText('show_and_hide_people')).toBeInTheDocument();
    expect(screen.getByTestId('user-page-layout')).not.toHaveAttribute('data-description');
  });

  it('does not call detailed face statistics on initial render', () => {
    renderPage();

    expect(sdkMock.getSpacePeopleFaceStatistics).not.toHaveBeenCalled();
  });

  it('renders a face statistics details button when overview stats exist', () => {
    renderPage({
      people: [makePerson({ id: 'p1' })],
      peopleStatistics: { total: 12, hidden: 2, detectedFaceCount: 2901 },
    });

    expect(screen.getByRole('button', { name: 'view_face_statistics_details' })).toBeInTheDocument();
  });

  it('loads and renders detailed space face statistics when the info button is clicked', async () => {
    sdkMock.getSpacePeopleFaceStatistics.mockResolvedValue(
      makeFaceStatistics({
        detectedFaceCount: 1234,
        assignedVisibleFaceCount: 2345,
        assignedHiddenFaceCount: 3456,
        unassignedFaceCount: 4567,
      }),
    );
    renderPage({
      people: [makePerson({ id: 'p1' })],
      peopleStatistics: { total: 12, hidden: 2, detectedFaceCount: 2901 },
    });

    await userEvent.click(screen.getByRole('button', { name: 'view_face_statistics_details' }));

    expect(sdkMock.getSpacePeopleFaceStatistics).toHaveBeenCalledWith({ id: 'space-1' });
    expect(await screen.findByText('detected_faces')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('assigned_to_visible_people')).toBeInTheDocument();
    expect(screen.getByText('2,345')).toBeInTheDocument();
    expect(screen.getByText('assigned_to_hidden_people')).toBeInTheDocument();
    expect(screen.getByText('3,456')).toBeInTheDocument();
    expect(screen.getByText('unassigned')).toBeInTheDocument();
    expect(screen.getByText('4,567')).toBeInTheDocument();
  });

  it('uses cached detailed space face statistics when the info UI is closed and reopened', async () => {
    sdkMock.getSpacePeopleFaceStatistics.mockResolvedValue(makeFaceStatistics({ detectedFaceCount: 1234 }));
    renderPage({
      people: [makePerson({ id: 'p1' })],
      peopleStatistics: { total: 12, hidden: 2, detectedFaceCount: 2901 },
    });

    const trigger = screen.getByRole('button', { name: 'view_face_statistics_details' });
    await userEvent.click(trigger);
    expect(await screen.findByText('1,234')).toBeInTheDocument();

    await userEvent.click(trigger);
    await userEvent.click(trigger);

    expect(sdkMock.getSpacePeopleFaceStatistics).toHaveBeenCalledTimes(1);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('loads detailed space face statistics with the active supported name search', async () => {
    sdkMock.getSpacePeople.mockResolvedValue([makePerson({ id: 'p1', name: 'Alice' })]);
    sdkMock.getSpacePeopleStatistics.mockResolvedValue({ total: 1, hidden: 0, detectedFaceCount: 7 });
    renderPage({
      people: [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })],
      peopleStatistics: { total: 2, hidden: 0, detectedFaceCount: 22 },
    });

    await fireEvent.input(screen.getByPlaceholderText('search_people'), { target: { value: 'Ali' } });
    await waitFor(() => {
      expect(sdkMock.getSpacePeopleStatistics).toHaveBeenCalledWith({ id: 'space-1', name: 'Ali' }, expect.any(Object));
    });

    await userEvent.click(screen.getByRole('button', { name: 'view_face_statistics_details' }));

    expect(sdkMock.getSpacePeopleFaceStatistics).toHaveBeenCalledWith({ id: 'space-1', name: 'Ali' });
  });

  it('hides the face statistics details button during initial URL name search until filtered stats load', () => {
    pageStore.setUrl('http://localhost/spaces/space-1/people?searchedPeople=Ali');

    renderPage({
      people: [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })],
      peopleStatistics: { total: 2, hidden: 0, detectedFaceCount: 22 },
    });

    expect(screen.queryByRole('button', { name: 'view_face_statistics_details' })).not.toBeInTheDocument();
    expect(sdkMock.getSpacePeopleFaceStatistics).not.toHaveBeenCalled();
  });

  it('does not expose detailed face statistics when a stale cleared search resolves after a new search starts', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })];
    const clearPeopleRequest = deferred<SharedSpacePersonResponseDto[]>();
    const clearStatsRequest = deferred<SharedSpacePeopleStatisticsResponseDto>();
    const bobPeopleRequest = deferred<SharedSpacePersonResponseDto[]>();
    const bobStatsRequest = deferred<SharedSpacePeopleStatisticsResponseDto>();

    sdkMock.getSpacePeople.mockImplementation(({ name }) => {
      if (name === 'Ali') {
        return Promise.resolve([people[0]]);
      }
      if (name === 'Bob') {
        return bobPeopleRequest.promise;
      }
      return clearPeopleRequest.promise;
    });
    sdkMock.getSpacePeopleStatistics.mockImplementation(({ name }) => {
      if (name === 'Ali') {
        return Promise.resolve({ total: 1, hidden: 0, detectedFaceCount: 7 });
      }
      if (name === 'Bob') {
        return bobStatsRequest.promise;
      }
      return clearStatsRequest.promise;
    });

    renderPage({ people, peopleStatistics: { total: 2, hidden: 0, detectedFaceCount: 22 } });

    await fireEvent.input(screen.getByPlaceholderText('search_people'), { target: { value: 'Ali' } });
    await waitFor(() => {
      expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(1) \u00B7 7 faces');
    });
    expect(screen.getByRole('button', { name: 'view_face_statistics_details' })).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('clear_value'));
    await waitFor(() => {
      expect(sdkMock.getSpacePeopleStatistics).toHaveBeenCalledWith({ id: 'space-1' });
    });

    await fireEvent.input(screen.getByPlaceholderText('search_people'), { target: { value: 'Bob' } });
    await waitFor(() => {
      expect(sdkMock.getSpacePeopleStatistics).toHaveBeenCalledWith({ id: 'space-1', name: 'Bob' }, expect.any(Object));
    });

    clearPeopleRequest.resolve(people);
    clearStatsRequest.resolve({ total: 2, hidden: 0, detectedFaceCount: 22 });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.queryByRole('button', { name: 'view_face_statistics_details' })).not.toBeInTheDocument();
    expect(sdkMock.getSpacePeopleFaceStatistics).not.toHaveBeenCalled();

    bobPeopleRequest.resolve([people[1]]);
    bobStatsRequest.resolve({ total: 1, hidden: 0, detectedFaceCount: 9 });
    await waitFor(() => {
      expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(1) \u00B7 9 faces');
    });

    await userEvent.click(screen.getByRole('button', { name: 'view_face_statistics_details' }));
    expect(sdkMock.getSpacePeopleFaceStatistics).toHaveBeenCalledWith({ id: 'space-1', name: 'Bob' });
  });

  it('does not apply stale space people statistics after navigating to another space', async () => {
    const space1 = makeSpace({ id: 'space-1', name: 'Space One' });
    const space2 = makeSpace({ id: 'space-2', name: 'Space Two' });
    const alice = makePerson({ id: 'alice', name: 'Alice', spaceId: 'space-1' });
    const bob = makePerson({ id: 'bob', name: 'Bob', spaceId: 'space-1' });
    const charlie = makePerson({ id: 'charlie', name: 'Charlie', spaceId: 'space-2' });
    const clearPeopleRequest = deferred<SharedSpacePersonResponseDto[]>();
    const clearStatsRequest = deferred<SharedSpacePeopleStatisticsResponseDto>();

    sdkMock.getSpacePeople.mockImplementation(({ id, name }) => {
      if (id === 'space-1' && name === 'Ali') {
        return Promise.resolve([alice]);
      }
      if (id === 'space-1') {
        return clearPeopleRequest.promise;
      }
      return Promise.resolve([charlie]);
    });
    sdkMock.getSpacePeopleStatistics.mockImplementation(({ id, name }) => {
      if (id === 'space-1' && name === 'Ali') {
        return Promise.resolve({ total: 1, hidden: 0, detectedFaceCount: 7 });
      }
      if (id === 'space-1') {
        return clearStatsRequest.promise;
      }
      return Promise.resolve({ total: 1, hidden: 0, detectedFaceCount: 9 });
    });

    const view = renderPage({
      space: space1,
      people: [alice, bob],
      peopleStatistics: { total: 2, hidden: 0, detectedFaceCount: 22 },
    });

    await fireEvent.input(screen.getByPlaceholderText('search_people'), { target: { value: 'Ali' } });
    await waitFor(() => {
      expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(1) \u00B7 7 faces');
    });

    await userEvent.click(screen.getByLabelText('clear_value'));
    await waitFor(() => {
      expect(sdkMock.getSpacePeopleStatistics).toHaveBeenCalledWith({ id: 'space-1' });
    });

    pageStore.setUrl('http://localhost/spaces/space-2/people');
    await view.rerender({
      data: {
        space: space2,
        members: [makeMember()],
        people: [charlie],
        peopleStatistics: { total: 1, hidden: 0, detectedFaceCount: 9 },
        meta: { title: 'Space Two - People' },
      },
    });

    clearPeopleRequest.resolve([alice, bob]);
    clearStatsRequest.resolve({ total: 2, hidden: 0, detectedFaceCount: 22 });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Alice')).not.toBeInTheDocument();
    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(1) \u00B7 9 faces');
  });

  it('does not show stale search errors after navigating to another space', async () => {
    const space1 = makeSpace({ id: 'space-1', name: 'Space One' });
    const space2 = makeSpace({ id: 'space-2', name: 'Space Two' });
    const alice = makePerson({ id: 'alice', name: 'Alice', spaceId: 'space-1' });
    const bob = makePerson({ id: 'bob', name: 'Bob', spaceId: 'space-1' });
    const charlie = makePerson({ id: 'charlie', name: 'Charlie', spaceId: 'space-2' });
    const searchPeopleRequest = deferred<SharedSpacePersonResponseDto[]>();

    sdkMock.getSpacePeople.mockImplementation(({ id, name }) => {
      if (id === 'space-1' && name === 'Ali') {
        return searchPeopleRequest.promise;
      }
      return Promise.resolve([charlie]);
    });
    sdkMock.getSpacePeopleStatistics.mockResolvedValue({ total: 1, hidden: 0, detectedFaceCount: 7 });

    const view = renderPage({
      space: space1,
      people: [alice, bob],
      peopleStatistics: { total: 2, hidden: 0, detectedFaceCount: 22 },
    });

    await fireEvent.input(screen.getByPlaceholderText('search_people'), { target: { value: 'Ali' } });
    await waitFor(() => {
      expect(sdkMock.getSpacePeople).toHaveBeenCalledWith(
        { id: 'space-1', name: 'Ali', limit: 100 },
        expect.any(Object),
      );
    });

    pageStore.setUrl('http://localhost/spaces/space-2/people');
    await view.rerender({
      data: {
        space: space2,
        members: [makeMember()],
        people: [charlie],
        peopleStatistics: { total: 1, hidden: 0, detectedFaceCount: 9 },
        meta: { title: 'Space Two - People' },
      },
    });

    searchPeopleRequest.reject(new Error('stale search failed'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(toastManager.danger).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument();
  });

  it('loads filtered detailed face statistics separately after search changes from empty to a name', async () => {
    sdkMock.getSpacePeople.mockResolvedValue([makePerson({ id: 'p1', name: 'Alice' })]);
    sdkMock.getSpacePeopleStatistics.mockResolvedValue({ total: 1, hidden: 0, detectedFaceCount: 7 });
    sdkMock.getSpacePeopleFaceStatistics
      .mockResolvedValueOnce(makeFaceStatistics({ detectedFaceCount: 1111 }))
      .mockResolvedValueOnce(makeFaceStatistics({ detectedFaceCount: 2222 }));
    renderPage({
      people: [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })],
      peopleStatistics: { total: 2, hidden: 0, detectedFaceCount: 22 },
    });

    const trigger = screen.getByRole('button', { name: 'view_face_statistics_details' });
    await userEvent.click(trigger);
    expect(await screen.findByText('1,111')).toBeInTheDocument();

    await fireEvent.input(screen.getByPlaceholderText('search_people'), { target: { value: 'Ali' } });
    await waitFor(() => {
      expect(sdkMock.getSpacePeopleStatistics).toHaveBeenCalledWith({ id: 'space-1', name: 'Ali' }, expect.any(Object));
    });

    expect(screen.queryByText('1,111')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'view_face_statistics_details' }));

    expect(await screen.findByText('2,222')).toBeInTheDocument();
    expect(sdkMock.getSpacePeopleFaceStatistics).toHaveBeenCalledTimes(2);
  });

  it('loads detailed space face statistics separately after the authenticated user changes', async () => {
    sdkMock.getSpacePeopleFaceStatistics
      .mockResolvedValueOnce(makeFaceStatistics({ detectedFaceCount: 1111 }))
      .mockResolvedValueOnce(makeFaceStatistics({ detectedFaceCount: 2222 }));
    renderPage({
      people: [makePerson({ id: 'p1' })],
      peopleStatistics: { total: 12, hidden: 2, detectedFaceCount: 2901 },
    });

    const trigger = screen.getByRole('button', { name: 'view_face_statistics_details' });
    await userEvent.click(trigger);
    expect(await screen.findByText('1,111')).toBeInTheDocument();

    await userEvent.click(trigger);
    authManager.setUser(userAdminFactory.build({ id: 'other-user-id' }));
    await userEvent.click(trigger);

    expect(await screen.findByText('2,222')).toBeInTheDocument();
    expect(sdkMock.getSpacePeopleFaceStatistics).toHaveBeenCalledTimes(2);
  });

  it('renders a detailed face statistics error while keeping the primary face count in the header', async () => {
    sdkMock.getSpacePeopleFaceStatistics.mockRejectedValue(new Error('network'));
    renderPage({
      people: [makePerson({ id: 'p1' })],
      peopleStatistics: { total: 12, hidden: 2, detectedFaceCount: 2901 },
    });

    await userEvent.click(screen.getByRole('button', { name: 'view_face_statistics_details' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('unable_to_load_face_statistics');
    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(10) \u00B7 2,901 faces');
  });

  it('hides the face statistics details button when overview statistics are unavailable', () => {
    renderPage({
      people: [makePerson({ id: 'p1', name: 'Alice' })],
      peopleStatistics: null,
    });

    expect(screen.queryByRole('button', { name: 'view_face_statistics_details' })).not.toBeInTheDocument();
  });

  it('hides the face statistics details button when no face count is visible in the header', () => {
    renderPage({
      people: [],
      peopleStatistics: { total: 0, hidden: 0, detectedFaceCount: 0 },
    });

    expect(screen.queryByRole('button', { name: 'view_face_statistics_details' })).not.toBeInTheDocument();
  });

  it('searches people within the current space and updates the heading count', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })];
    sdkMock.getSpacePeople.mockResolvedValue([people[0]]);
    sdkMock.getSpacePeopleStatistics.mockResolvedValue({ total: 1, hidden: 0, detectedFaceCount: 7 });

    renderPage({ people, peopleStatistics: { total: 2, hidden: 0, detectedFaceCount: 22 } });

    await fireEvent.input(screen.getByPlaceholderText('search_people'), { target: { value: 'Ali' } });

    await waitFor(() => {
      expect(sdkMock.getSpacePeople).toHaveBeenCalledWith(
        { id: 'space-1', name: 'Ali', limit: 100 },
        expect.any(Object),
      );
    });
    expect(sdkMock.getSpacePeopleStatistics).toHaveBeenCalledWith({ id: 'space-1', name: 'Ali' }, expect.any(Object));
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Bob')).not.toBeInTheDocument();
    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(1) \u00B7 7 faces');
  });

  it('clears search statistics back to the unfiltered space scope', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    sdkMock.getSpacePeople.mockResolvedValue(people);
    sdkMock.getSpacePeopleStatistics
      .mockResolvedValueOnce({ total: 1, hidden: 0, detectedFaceCount: 7 })
      .mockResolvedValueOnce({ total: 2, hidden: 0, detectedFaceCount: 22 });

    renderPage({ people, peopleStatistics: { total: 2, hidden: 0, detectedFaceCount: 22 } });

    await fireEvent.input(screen.getByPlaceholderText('search_people'), { target: { value: 'Ali' } });
    await waitFor(() => {
      expect(sdkMock.getSpacePeopleStatistics).toHaveBeenCalledWith({ id: 'space-1', name: 'Ali' }, expect.any(Object));
    });

    await userEvent.click(screen.getByLabelText('clear_value'));

    await waitFor(() => {
      expect(sdkMock.getSpacePeopleStatistics).toHaveBeenCalledWith({ id: 'space-1' });
    });
  });

  it('keeps search results when filtered overview statistics fail', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' }), makePerson({ id: 'p2', name: 'Bob' })];
    sdkMock.getSpacePeople.mockResolvedValue([people[0]]);
    sdkMock.getSpacePeopleStatistics.mockRejectedValue(new Error('stats unavailable'));

    renderPage({ people, peopleStatistics: { total: 2, hidden: 0, detectedFaceCount: 22 } });

    await fireEvent.input(screen.getByPlaceholderText('search_people'), { target: { value: 'Ali' } });

    await waitFor(() => {
      expect(sdkMock.getSpacePeople).toHaveBeenCalledWith(
        { id: 'space-1', name: 'Ali', limit: 100 },
        expect.any(Object),
      );
    });
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Bob')).not.toBeInTheDocument();
    expect(screen.getByTestId('user-page-layout')).not.toHaveAttribute('data-description');
  });

  it('updates the hidden count without losing the detected face count when a person is hidden', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice' })];
    const { baseElement } = renderPage({
      people,
      peopleStatistics: { total: 2, hidden: 0, detectedFaceCount: 42 },
      members: [makeMember({ role: SharedSpaceRole.Editor })],
    });

    await fireEvent.mouseEnter(baseElement.querySelector('[role="group"]')!);

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('show_person_options'));
    await user.click(screen.getByText('hide_person'));

    await waitFor(() => {
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith({
        id: 'space-1',
        personId: 'p1',
        sharedSpacePersonUpdateDto: { isHidden: true },
      });
    });
    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(1) \u00B7 42 faces');
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
