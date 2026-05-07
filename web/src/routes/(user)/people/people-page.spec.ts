import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { clearPeopleFaceStatisticsInfoCache } from '$lib/components/people/people-face-statistics-info-cache';
import { authManager } from '$lib/managers/auth-manager.svelte';
import {
  RepresentativeFaceSource,
  Type,
  type PeopleFaceStatisticsResponseDto,
  type PeopleStatisticsResponseDto,
  type PersonResponseDto,
  type SharedSpacePersonResponseDto,
} from '@immich/sdk';
import { personFactory } from '@test-data/factories/person-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import PeoplePage from './+page.svelte';

const { gotoMock, pageStore } = vi.hoisted(() => {
  let pageValue = {
    url: new URL('http://localhost/people'),
    route: { id: '/(user)/people' },
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
    toastManager: { primary: vi.fn(), success: vi.fn(), warning: vi.fn() },
  };
});

vi.mock('$lib/components/layouts/user-page-layout.svelte', async () => {
  const { default: MockComponent } = await import('$lib/components/spaces/mock-user-page-layout.test-wrapper.svelte');
  return { default: MockComponent };
});

function makePerson(overrides: Partial<PersonResponseDto> = {}): PersonResponseDto {
  return personFactory.build({
    id: 'person-1',
    name: 'Alice',
    isHidden: false,
    isFavorite: false,
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  });
}

function makeSpacePerson(overrides: Partial<SharedSpacePersonResponseDto> = {}): SharedSpacePersonResponseDto {
  return {
    id: 'space-person-1',
    spaceId: 'space-1',
    name: 'Shared Alice',
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

function makeFaceStatistics(overrides: Partial<PeopleFaceStatisticsResponseDto> = {}): PeopleFaceStatisticsResponseDto {
  return {
    assignedHiddenFaceCount: 3456,
    assignedVisibleFaceCount: 2345,
    detectedFaceCount: 1234,
    namedVisiblePersonCount: 154,
    unassignedFaceCount: 4567,
    ...overrides,
  };
}

function getDefaultPeopleStatistics(people: PersonResponseDto[]): PeopleStatisticsResponseDto {
  return {
    total: people.length,
    hidden: people.filter((person) => person.isHidden).length,
    detectedFaceCount: 0,
  };
}

function renderPage(
  people: PersonResponseDto[] = [makePerson()],
  peopleStatistics: PeopleStatisticsResponseDto | null = getDefaultPeopleStatistics(people),
) {
  return render(PeoplePage, {
    props: {
      data: {
        people: {
          people,
          total: people.length,
          hidden: people.filter((person) => person.isHidden).length,
          hasNextPage: false,
        },
        peopleStatistics,
        meta: { title: 'People' },
      },
    },
  });
}

describe('Global people page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearPeopleFaceStatisticsInfoCache();
    authManager.setUser(userAdminFactory.build({ id: 'current-user-id' }));
    authManager.setPreferences(preferencesFactory.build());
    Element.prototype.animate = getAnimateMock();
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    pageStore.setUrl('http://localhost/people');
    gotoMock.mockResolvedValue(undefined);
    sdkMock.searchPerson.mockResolvedValue([]);
    sdkMock.getPeopleFaceStatistics.mockResolvedValue(makeFaceStatistics());
    sdkMock.updatePerson.mockImplementation(({ id, personUpdateDto }) =>
      Promise.resolve(
        makePerson({
          id,
          name: personUpdateDto.name ?? 'Alice',
          birthDate: personUpdateDto.birthDate,
          isFavorite: personUpdateDto.isFavorite ?? false,
          isHidden: personUpdateDto.isHidden ?? false,
        }),
      ),
    );
  });

  it('renders people with the shared tile link and editable name footer', () => {
    const person = makePerson({ id: 'p1', name: 'Alice' });
    renderPage([person]);

    expect(screen.getByRole('link', { name: 'Alice' })).toHaveAttribute('href', '/people/p1?previousRoute=%2Fpeople');
    expect(screen.getByDisplayValue('Alice')).toHaveAttribute('placeholder', 'add_a_name');
  });

  it('shows visible people and detected faces in the heading', () => {
    renderPage([makePerson({ id: 'p1' })], { total: 12, hidden: 2, detectedFaceCount: 2901 });

    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(10) \u00B7 2,901 faces');
  });

  it('derives the heading person count from overview statistics instead of loaded rows', () => {
    renderPage([makePerson({ id: 'p1' })], { total: 60, hidden: 4, detectedFaceCount: 100 });

    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(56) \u00B7 100 faces');
  });

  it('shows detected faces when all people are hidden', () => {
    renderPage([makePerson({ id: 'p1', isHidden: true })], { total: 1, hidden: 1, detectedFaceCount: 42 });

    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(0) \u00B7 42 faces');
  });

  it('omits the heading description for an empty scope with no detected faces', () => {
    renderPage([], { total: 0, hidden: 0, detectedFaceCount: 0 });

    expect(screen.getByTestId('user-page-layout')).not.toHaveAttribute('data-description');
  });

  it('keeps rendering people and falls back to the list count when statistics are unavailable', () => {
    renderPage([makePerson({ id: 'p1', name: 'Alice' })], null);

    expect(screen.getByRole('link', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(1)');
  });

  it('does not call detailed face statistics on initial render', () => {
    renderPage([makePerson()]);

    expect(sdkMock.getPeopleFaceStatistics).not.toHaveBeenCalled();
  });

  it('renders a face statistics details button when overview stats exist and no global search is active', () => {
    renderPage([makePerson({ id: 'p1' })], { total: 12, hidden: 2, detectedFaceCount: 2901 });

    expect(screen.getByRole('button', { name: 'view_face_statistics_details' })).toBeInTheDocument();
  });

  it('loads and renders detailed global face statistics when the info button is clicked', async () => {
    sdkMock.getPeopleFaceStatistics.mockResolvedValue(
      makeFaceStatistics({
        detectedFaceCount: 1234,
        assignedVisibleFaceCount: 2345,
        namedVisiblePersonCount: 154,
        assignedHiddenFaceCount: 3456,
        unassignedFaceCount: 4567,
      }),
    );
    renderPage([makePerson({ id: 'p1' })], { total: 12, hidden: 2, detectedFaceCount: 2901 });

    await userEvent.click(screen.getByRole('button', { name: 'view_face_statistics_details' }));

    expect(sdkMock.getPeopleFaceStatistics).toHaveBeenCalledWith({ withSharedSpaces: true });
    expect(await screen.findByText('detected_faces')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('assigned_to_visible_people')).toBeInTheDocument();
    expect(screen.getByText('2,345')).toBeInTheDocument();
    expect(screen.getByText('named_visible_people')).toBeInTheDocument();
    expect(screen.getByText('154')).toBeInTheDocument();
    expect(screen.getByText('assigned_to_hidden_people')).toBeInTheDocument();
    expect(screen.getByText('3,456')).toBeInTheDocument();
    expect(screen.getByText('unassigned')).toBeInTheDocument();
    expect(screen.getByText('4,567')).toBeInTheDocument();
  });

  it('uses cached detailed global face statistics when the info UI is closed and reopened', async () => {
    sdkMock.getPeopleFaceStatistics.mockResolvedValue(makeFaceStatistics({ detectedFaceCount: 1234 }));
    renderPage([makePerson({ id: 'p1' })], { total: 12, hidden: 2, detectedFaceCount: 2901 });

    const trigger = screen.getByRole('button', { name: 'view_face_statistics_details' });
    await userEvent.click(trigger);
    expect(await screen.findByText('1,234')).toBeInTheDocument();

    await userEvent.click(trigger);
    await userEvent.click(trigger);

    expect(sdkMock.getPeopleFaceStatistics).toHaveBeenCalledTimes(1);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('loads detailed global face statistics separately after the authenticated user changes', async () => {
    sdkMock.getPeopleFaceStatistics
      .mockResolvedValueOnce(makeFaceStatistics({ detectedFaceCount: 1111 }))
      .mockResolvedValueOnce(makeFaceStatistics({ detectedFaceCount: 2222 }));
    renderPage([makePerson({ id: 'p1' })], { total: 12, hidden: 2, detectedFaceCount: 2901 });

    const trigger = screen.getByRole('button', { name: 'view_face_statistics_details' });
    await userEvent.click(trigger);
    expect(await screen.findByText('1,111')).toBeInTheDocument();

    await userEvent.click(trigger);
    authManager.setUser(userAdminFactory.build({ id: 'other-user-id' }));
    await userEvent.click(trigger);

    expect(await screen.findByText('2,222')).toBeInTheDocument();
    expect(sdkMock.getPeopleFaceStatistics).toHaveBeenCalledTimes(2);
  });

  it('renders a detailed face statistics error while keeping the primary face count in the header', async () => {
    sdkMock.getPeopleFaceStatistics.mockRejectedValue(new Error('network'));
    renderPage([makePerson({ id: 'p1' })], { total: 12, hidden: 2, detectedFaceCount: 2901 });

    await userEvent.click(screen.getByRole('button', { name: 'view_face_statistics_details' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('unable_to_load_face_statistics');
    expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(10) \u00B7 2,901 faces');
  });

  it('hides the face count while global name search is active because it is unsupported by overview stats', async () => {
    pageStore.setUrl('http://localhost/people?searchedPeople=Ali');
    sdkMock.searchPerson.mockResolvedValue([makePerson({ id: 'p1', name: 'Alice' })]);

    renderPage([makePerson({ id: 'p1', name: 'Alice' })], { total: 12, hidden: 2, detectedFaceCount: 2901 });

    await waitFor(() => {
      expect(sdkMock.searchPerson).toHaveBeenCalledWith({ name: 'Ali', withSharedSpaces: true }, expect.any(Object));
    });
    await waitFor(() => {
      expect(screen.getByTestId('user-page-layout')).toHaveAttribute('data-description', '(1)');
    });
    expect(screen.getByTestId('user-page-layout').dataset.description ?? '').not.toContain('faces');
  });

  it('hides the face statistics details button during unsupported global name search', async () => {
    pageStore.setUrl('http://localhost/people?searchedPeople=Ali');
    sdkMock.searchPerson.mockResolvedValue([makePerson({ id: 'p1', name: 'Alice' })]);

    renderPage([makePerson({ id: 'p1', name: 'Alice' })], { total: 12, hidden: 2, detectedFaceCount: 2901 });

    expect(screen.queryByRole('button', { name: 'view_face_statistics_details' })).not.toBeInTheDocument();
    expect(sdkMock.getPeopleFaceStatistics).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(sdkMock.searchPerson).toHaveBeenCalledWith({ name: 'Ali', withSharedSpaces: true }, expect.any(Object));
    });
    expect(screen.queryByRole('button', { name: 'view_face_statistics_details' })).not.toBeInTheDocument();
    expect(sdkMock.getPeopleFaceStatistics).not.toHaveBeenCalled();
  });

  it('does not render the face statistics details button at any point during initial unsupported global name search', async () => {
    pageStore.setUrl('http://localhost/people?searchedPeople=Ali');
    const renderedButtonLabels: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) {
            continue;
          }
          const labeledElements = [
            ...(node.matches('[aria-label]') ? [node] : []),
            ...node.querySelectorAll<HTMLElement>('[aria-label]'),
          ];
          renderedButtonLabels.push(...labeledElements.map((element) => element.getAttribute('aria-label') ?? ''));
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    renderPage([makePerson({ id: 'p1', name: 'Alice' })], {
      total: 12,
      hidden: 2,
      detectedFaceCount: 2901,
    });
    await Promise.resolve();
    observer.disconnect();

    expect(renderedButtonLabels).not.toContain('view_face_statistics_details');
    expect(screen.queryByRole('button', { name: 'view_face_statistics_details' })).not.toBeInTheDocument();
    expect(sdkMock.getPeopleFaceStatistics).not.toHaveBeenCalled();
  });

  it('hides the face statistics details button when overview statistics are unavailable', () => {
    renderPage([makePerson({ id: 'p1', name: 'Alice' })], null);

    expect(screen.queryByRole('button', { name: 'view_face_statistics_details' })).not.toBeInTheDocument();
  });

  it('hides the face statistics details button when no face count is visible in the header', () => {
    renderPage([], { total: 0, hidden: 0, detectedFaceCount: 0 });

    expect(screen.queryByRole('button', { name: 'view_face_statistics_details' })).not.toBeInTheDocument();
  });

  it('saves global person names through the shared editable footer', async () => {
    const person = makePerson({ id: 'p1', name: 'Alice' });
    renderPage([person]);

    const input = screen.getByDisplayValue('Alice');
    const user = userEvent.setup();

    await user.click(input);
    await user.clear(input);
    await user.type(input, 'Alicia');
    await fireEvent.focusOut(input);

    await waitFor(() => {
      expect(sdkMock.updatePerson).toHaveBeenCalledWith({
        id: 'p1',
        personUpdateDto: { name: 'Alicia' },
      });
    });
  });

  it('keeps global person actions on the shared tile action slot', async () => {
    const person = makePerson({ id: 'p1', name: 'Alice', isFavorite: false });
    const { baseElement } = renderPage([person]);

    await fireEvent.mouseEnter(baseElement.querySelector('[role="group"]')!);

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('show_person_options'));

    expect(screen.getByText('hide_person')).toBeInTheDocument();
    expect(screen.getByText('set_date_of_birth')).toBeInTheDocument();
    expect(screen.getByText('merge_people')).toBeInTheDocument();
    expect(screen.getByText('to_favorite')).toBeInTheDocument();

    await user.click(screen.getByText('merge_people'));

    expect(gotoMock).toHaveBeenCalledWith('/people/p1?previousRoute=%2Fpeople&action=merge');
  });

  it('routes a space-primary person to identity-wide person detail', () => {
    renderPage([
      makePerson({
        id: 'space-person-1',
        name: 'Shared Alice',
        isFavorite: undefined,
        primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
        numberOfAssets: 4,
      }),
    ]);

    expect(screen.getByRole('link', { name: 'Shared Alice' })).toHaveAttribute(
      'href',
      '/people/space-person-1?previousRoute=%2Fpeople',
    );
    expect(screen.getByTitle('Shared Alice').getAttribute('src')).toContain(
      '/shared-spaces/space-1/people/space-person-1/thumbnail?updatedAt=2026-01-02T00%3A00%3A00.000Z',
    );
  });

  it('saves space-primary person names inline through the space people API', async () => {
    const person = makePerson({
      id: 'space-person-1',
      name: 'Shared Alice',
      isFavorite: undefined,
      primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
    });
    sdkMock.updateSpacePerson.mockResolvedValue(makeSpacePerson({ name: 'Shared Alicia' }));
    renderPage([person]);

    const input = screen.getByDisplayValue('Shared Alice');
    const user = userEvent.setup();

    await user.click(input);
    await user.clear(input);
    await user.type(input, 'Shared Alicia');
    await fireEvent.focusOut(input);

    await waitFor(() => {
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith({
        id: 'space-1',
        personId: 'space-person-1',
        sharedSpacePersonUpdateDto: { name: 'Shared Alicia' },
      });
    });
    expect(sdkMock.updatePerson).not.toHaveBeenCalled();
  });

  it('keeps personal actions off shared-space-only rows', async () => {
    const { baseElement } = renderPage([
      makePerson({
        id: 'space-person-1',
        name: 'Shared Alice',
        isFavorite: undefined,
        primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
      }),
    ]);

    await fireEvent.mouseEnter(baseElement.querySelector('[role="group"]')!);

    expect(screen.getByDisplayValue('Shared Alice')).toHaveAttribute('placeholder', 'add_a_name');
    expect(screen.queryByLabelText('show_person_options')).not.toBeInTheDocument();
    expect(screen.queryByText('to_favorite')).not.toBeInTheDocument();
    expect(screen.queryByText('hide_person')).not.toBeInTheDocument();
  });
});
