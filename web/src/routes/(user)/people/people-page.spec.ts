import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import type { PersonResponseDto } from '@immich/sdk';
import { personFactory } from '@test-data/factories/person-factory';
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

function renderPage(people: PersonResponseDto[] = [makePerson()]) {
  return render(PeoplePage, {
    props: {
      data: {
        people: {
          people,
          total: people.length,
          hidden: people.filter((person) => person.isHidden).length,
          hasNextPage: false,
        },
        meta: { title: 'People' },
      },
    },
  });
}

describe('Global people page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    pageStore.setUrl('http://localhost/people');
    gotoMock.mockResolvedValue(undefined);
    sdkMock.searchPerson.mockResolvedValue([]);
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
});
