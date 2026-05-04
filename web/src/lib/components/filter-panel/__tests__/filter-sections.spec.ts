import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import CameraFilter from '../camera-filter.svelte';
import type { PersonOption } from '../filter-panel';
import FilterPanel from '../filter-panel.svelte';
import LocationFilter from '../location-filter.svelte';
import PeopleFilter from '../people-filter.svelte';

const mockPeople: PersonOption[] = [
  { id: 'p1', name: 'Sarah Chen' },
  { id: 'p2', name: 'Max Chen' },
  { id: 'p3', name: 'Li Wei' },
  { id: 'p4', name: 'Anna Schmidt' },
  { id: 'p5', name: 'Tom Brown' },
  { id: 'p6', name: 'Jane Doe' },
  { id: 'p7', name: 'Alex Kim' },
];

describe('PeopleFilter', () => {
  it('should render people with checkboxes', () => {
    const { getByTestId } = render(PeopleFilter, {
      props: {
        people: mockPeople.slice(0, 3),
        selectedIds: [],
        onSelectionChange: () => {},
      },
    });
    expect(getByTestId('people-item-p1')).toBeTruthy();
    expect(getByTestId('people-item-p2')).toBeTruthy();
    expect(getByTestId('people-item-p3')).toBeTruthy();
  });

  it('should support multi-select (selecting B keeps A selected)', async () => {
    let selected: string[] = [];
    const onSelectionChange = (ids: string[]) => {
      selected = ids;
    };

    const { getByTestId, rerender } = render(PeopleFilter, {
      props: {
        people: mockPeople.slice(0, 3),
        selectedIds: [],
        onSelectionChange,
      },
    });

    // Select first person
    await fireEvent.click(getByTestId('people-item-p1'));
    expect(selected).toEqual(['p1']);

    // Rerender with new selectedIds to simulate parent state update
    await rerender({
      people: mockPeople.slice(0, 3),
      selectedIds: ['p1'],
      onSelectionChange,
    });

    // Select second person
    await fireEvent.click(getByTestId('people-item-p2'));
    expect(selected).toEqual(['p1', 'p2']);
  });

  it('should deselect and remove from selection array', async () => {
    let selected: string[] = [];
    const onSelectionChange = (ids: string[]) => {
      selected = ids;
    };

    const { getByTestId } = render(PeopleFilter, {
      props: {
        people: mockPeople.slice(0, 3),
        selectedIds: ['p1', 'p2'],
        onSelectionChange,
      },
    });

    // Deselect p1
    await fireEvent.click(getByTestId('people-item-p1'));
    expect(selected).toEqual(['p2']);
  });

  it('should emit correct filter state with selected ids', async () => {
    let selected: string[] = [];
    const onSelectionChange = (ids: string[]) => {
      selected = ids;
    };

    const { getByTestId } = render(PeopleFilter, {
      props: {
        people: mockPeople.slice(0, 3),
        selectedIds: [],
        onSelectionChange,
      },
    });

    await fireEvent.click(getByTestId('people-item-p3'));
    expect(selected).toEqual(['p3']);
  });

  it('should filter list via search input', async () => {
    const { getByTestId, queryByTestId } = render(PeopleFilter, {
      props: {
        people: mockPeople.slice(0, 5),
        selectedIds: [],
        onSelectionChange: () => {},
      },
    });

    const searchInput = getByTestId('people-search-input');
    await fireEvent.input(searchInput, { target: { value: 'Chen' } });

    // Sarah Chen and Max Chen should be visible
    expect(queryByTestId('people-item-p1')).toBeTruthy();
    expect(queryByTestId('people-item-p2')).toBeTruthy();
    // Others should be hidden
    expect(queryByTestId('people-item-p3')).toBeNull();
    expect(queryByTestId('people-item-p4')).toBeNull();
    expect(queryByTestId('people-item-p5')).toBeNull();
  });

  it('should show "Show N more" when list exceeds 5 items', () => {
    const { getByTestId, queryByTestId } = render(PeopleFilter, {
      props: {
        people: mockPeople,
        selectedIds: [],
        onSelectionChange: () => {},
      },
    });

    // First 5 should be visible
    expect(queryByTestId('people-item-p1')).toBeTruthy();
    expect(queryByTestId('people-item-p5')).toBeTruthy();
    // 6th and 7th should be hidden
    expect(queryByTestId('people-item-p6')).toBeNull();
    expect(queryByTestId('people-item-p7')).toBeNull();

    // "Show 2 more" link should appear
    const showMore = getByTestId('people-show-more');
    expect(showMore.textContent).toContain('Show 2 more');
  });

  it('should expand list when "Show N more" is clicked', async () => {
    const { getByTestId, queryByTestId } = render(PeopleFilter, {
      props: {
        people: mockPeople,
        selectedIds: [],
        onSelectionChange: () => {},
      },
    });

    await fireEvent.click(getByTestId('people-show-more'));

    // Now all 7 should be visible
    expect(queryByTestId('people-item-p6')).toBeTruthy();
    expect(queryByTestId('people-item-p7')).toBeTruthy();
  });

  it('should render thumbnail images when thumbnailUrl is provided', () => {
    const people: PersonOption[] = [
      { id: '1', name: 'Alice', thumbnailUrl: '/shared-spaces/s1/people/1/thumbnail' },
      { id: '2', name: 'Bob', thumbnailUrl: '/shared-spaces/s1/people/2/thumbnail' },
    ];
    const { container } = render(PeopleFilter, {
      props: { people, selectedIds: [], onSelectionChange: vi.fn() },
    });
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', '/shared-spaces/s1/people/1/thumbnail');
    expect(images[1]).toHaveAttribute('src', '/shared-spaces/s1/people/2/thumbnail');
  });

  it('should render gradient avatar when thumbnailUrl is not provided', () => {
    const people: PersonOption[] = [{ id: '1', name: 'Alice' }];
    const { container, getByText } = render(PeopleFilter, {
      props: { people, selectedIds: [], onSelectionChange: vi.fn() },
    });
    expect(container.querySelector('img')).toBeNull();
    expect(getByText('A')).toBeTruthy();
  });

  it('should show all search results without truncation', async () => {
    const { getByTestId, queryByTestId } = render(PeopleFilter, {
      props: {
        people: mockPeople,
        selectedIds: [],
        onSelectionChange: () => {},
      },
    });

    // Search for "Chen" — should match Sarah Chen and Max Chen (2 results)
    // But also test with more results: search for common substring
    const searchInput = getByTestId('people-search-input');
    await fireEvent.input(searchInput, { target: { value: 'Chen' } });

    // Both matches should be visible (not truncated)
    expect(queryByTestId('people-item-p1')).toBeTruthy();
    expect(queryByTestId('people-item-p2')).toBeTruthy();
    // Non-matches hidden
    expect(queryByTestId('people-item-p3')).toBeNull();
  });

  it('should show all search results even when more than INITIAL_SHOW_COUNT match', async () => {
    // Create 8 people with similar names to exceed INITIAL_SHOW_COUNT of 5
    const manyPeople: PersonOption[] = [
      { id: 'p1', name: 'Smith Alice' },
      { id: 'p2', name: 'Smith Bob' },
      { id: 'p3', name: 'Smith Carol' },
      { id: 'p4', name: 'Smith Dave' },
      { id: 'p5', name: 'Smith Eve' },
      { id: 'p6', name: 'Smith Frank' },
      { id: 'p7', name: 'Smith Grace' },
      { id: 'p8', name: 'Jones Hank' },
    ];

    const { getByTestId, queryByTestId } = render(PeopleFilter, {
      props: {
        people: manyPeople,
        selectedIds: [],
        onSelectionChange: () => {},
      },
    });

    const searchInput = getByTestId('people-search-input');
    await fireEvent.input(searchInput, { target: { value: 'Smith' } });

    // All 7 Smith matches should be visible — no truncation at 5
    expect(queryByTestId('people-item-p1')).toBeTruthy();
    expect(queryByTestId('people-item-p2')).toBeTruthy();
    expect(queryByTestId('people-item-p3')).toBeTruthy();
    expect(queryByTestId('people-item-p4')).toBeTruthy();
    expect(queryByTestId('people-item-p5')).toBeTruthy();
    expect(queryByTestId('people-item-p6')).toBeTruthy();
    expect(queryByTestId('people-item-p7')).toBeTruthy();
    // Non-match hidden
    expect(queryByTestId('people-item-p8')).toBeNull();
  });

  it('should show empty message when no people', () => {
    const { getByTestId } = render(PeopleFilter, {
      props: {
        people: [],
        selectedIds: [],
        onSelectionChange: () => {},
      },
    });

    expect(getByTestId('people-empty').textContent).toBe('No people found');
  });

  it('should display orphaned selected person name from typed search cache', () => {
    const { getByTestId } = render(PeopleFilter, {
      props: {
        people: [{ id: 'p-other', name: 'Other Person' }],
        selectedIds: ['p-cat'],
        selectedNames: new Map([['p-cat', 'cat']]),
        onSelectionChange: () => {},
      },
    });

    const orphanItem = getByTestId('people-item-p-cat');
    expect(orphanItem.textContent).toContain('cat');
    expect(orphanItem.textContent).not.toContain('p-cat');
  });

  it('should show typed selected person even when suggestions are empty', () => {
    const { getByTestId, queryByTestId } = render(PeopleFilter, {
      props: {
        people: [],
        selectedIds: ['p-cat'],
        selectedNames: new Map([['p-cat', 'cat']]),
        onSelectionChange: () => {},
      },
    });

    expect(queryByTestId('people-empty')).toBeNull();
    expect(getByTestId('people-item-p-cat').textContent).toContain('cat');
  });
});

describe('LocationFilter', () => {
  const mockCountries = ['Germany', 'Italy', 'France'];
  const mockCityFetch = (country: string): Promise<string[]> => {
    const cityMap: Record<string, string[]> = {
      Germany: ['Munich', 'Berlin', 'Hamburg'],
      Italy: ['Rome', 'Milan'],
      France: ['Paris', 'Lyon'],
    };
    return Promise.resolve(cityMap[country] ?? []);
  };

  it('should render countries with radio buttons', () => {
    const { getByTestId } = render(LocationFilter, {
      props: {
        countries: mockCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    expect(getByTestId('location-country-Germany')).toBeTruthy();
    expect(getByTestId('location-country-Italy')).toBeTruthy();
    expect(getByTestId('location-country-France')).toBeTruthy();
  });

  it('should be single-select (selecting B deselects A)', async () => {
    let lastCountry: string | undefined;
    let lastCity: string | undefined;
    const onSelectionChange = (country?: string, city?: string) => {
      lastCountry = country;
      lastCity = city;
    };

    const { getByTestId } = render(LocationFilter, {
      props: {
        countries: mockCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange,
      },
    });

    // Select Germany
    await fireEvent.click(getByTestId('location-country-Germany'));
    expect(lastCountry).toBe('Germany');
    expect(lastCity).toBeUndefined();

    // Select Italy (should deselect Germany)
    await fireEvent.click(getByTestId('location-country-Italy'));
    expect(lastCountry).toBe('Italy');
    expect(lastCity).toBeUndefined();
  });

  it('should show cities when country is expanded', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: mockCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    await fireEvent.click(getByTestId('location-country-Germany'));

    // Wait for async city fetch
    await waitFor(() => {
      expect(queryByTestId('location-city-Munich')).toBeTruthy();
      expect(queryByTestId('location-city-Berlin')).toBeTruthy();
      expect(queryByTestId('location-city-Hamburg')).toBeTruthy();
    });
  });

  it('should cap expanded city lists and expand cities with city-level show more', async () => {
    const cities = Array.from({ length: 12 }, (_, index) => `City ${index + 1}`);

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany'],
        onCityFetch: () => Promise.resolve(cities),
        onSelectionChange: () => {},
      },
    });

    await fireEvent.click(getByTestId('location-country-Germany'));

    await waitFor(() => {
      expect(queryByTestId('location-city-City 1')).toBeTruthy();
      expect(queryByTestId('location-city-City 10')).toBeTruthy();
      expect(queryByTestId('location-city-City 11')).toBeNull();
      expect(queryByTestId('location-city-City 12')).toBeNull();
      expect(getByTestId('location-city-show-more-Germany').textContent).toContain('Show 2 more');
    });

    await fireEvent.click(getByTestId('location-city-show-more-Germany'));

    expect(queryByTestId('location-city-City 11')).toBeTruthy();
    expect(queryByTestId('location-city-City 12')).toBeTruthy();
  });

  it('should keep a selected city visible when it is outside the initial city cap', async () => {
    const cities = Array.from({ length: 12 }, (_, index) => `City ${index + 1}`);
    const onSelectionChange = vi.fn();

    const { queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany'],
        selectedCountry: 'Germany',
        selectedCity: 'City 11',
        onCityFetch: () => Promise.resolve(cities),
        onSelectionChange,
      },
    });

    await waitFor(() => {
      expect(queryByTestId('location-city-City 9')).toBeTruthy();
      expect(queryByTestId('location-city-City 10')).toBeNull();
      expect(queryByTestId('location-city-City 11')).toBeTruthy();
      expect(queryByTestId('location-city-City 12')).toBeNull();
      expect(queryByTestId('location-city-show-more-Germany')).toBeTruthy();
    });
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should mark a city-only selection as selected under its matching country', async () => {
    const onSelectionChange = vi.fn();

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['United States of America'],
        selectedCity: 'New York City',
        onCityFetch: () => Promise.resolve(['New York City', 'Seattle']),
        onSelectionChange,
      },
    });

    await fireEvent.click(getByTestId('location-country-United States of America'));
    onSelectionChange.mockClear();

    await waitFor(() => expect(queryByTestId('location-city-New York City')).toBeTruthy());
    const selectedCity = getByTestId('location-city-New York City');
    expect(selectedCity.className).toContain('font-medium');
    expect(selectedCity.textContent).toContain('New York City');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should show a selected city-only filter before a country is expanded', () => {
    const onSelectionChange = vi.fn();

    const { getByTestId } = render(LocationFilter, {
      props: {
        countries: ['United States of America'],
        selectedCity: 'New York City',
        onCityFetch: () => Promise.resolve(['New York City', 'Seattle']),
        onSelectionChange,
      },
    });

    const selectedCity = getByTestId('location-city-New York City');
    expect(selectedCity.className).toContain('font-medium');
    expect(selectedCity.textContent).toContain('New York City');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should clear a city-only selection when clicking the selected city', async () => {
    const onSelectionChange = vi.fn();

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['United States of America'],
        selectedCity: 'New York City',
        onCityFetch: () => Promise.resolve(['New York City', 'Seattle']),
        onSelectionChange,
      },
    });

    await fireEvent.click(getByTestId('location-country-United States of America'));
    await waitFor(() => expect(queryByTestId('location-city-New York City')).toBeTruthy());
    onSelectionChange.mockClear();

    await fireEvent.click(getByTestId('location-city-New York City'));

    expect(onSelectionChange).toHaveBeenCalledWith(undefined, undefined);
  });

  it('should keep a selected city visible when it does not match the active search', async () => {
    const onSelectionChange = vi.fn();

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany', 'Italy'],
        selectedCountry: 'Germany',
        selectedCity: 'Berlin',
        onCityFetch: () => Promise.resolve(['Berlin', 'Munich']),
        onSelectionChange,
      },
    });

    await waitFor(() => expect(queryByTestId('location-city-Berlin')).toBeTruthy());

    await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'Italy' } });

    expect(queryByTestId('location-country-Germany')).toBeTruthy();
    expect(queryByTestId('location-city-Berlin')).toBeTruthy();
    expect(queryByTestId('location-country-Italy')).toBeTruthy();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should expand hidden cities only for the selected country city list', async () => {
    const cityMap: Record<string, string[]> = {
      Germany: Array.from({ length: 12 }, (_, index) => `German City ${index + 1}`),
      France: Array.from({ length: 12 }, (_, index) => `French City ${index + 1}`),
    };

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany', 'France'],
        onCityFetch: (country: string) => Promise.resolve(cityMap[country] ?? []),
        onSelectionChange: () => {},
      },
    });

    await fireEvent.click(getByTestId('location-country-Germany'));
    await waitFor(() => expect(queryByTestId('location-city-show-more-Germany')).toBeTruthy());

    await fireEvent.click(getByTestId('location-city-show-more-Germany'));
    expect(queryByTestId('location-city-German City 11')).toBeTruthy();

    await fireEvent.click(getByTestId('location-country-France'));
    await waitFor(() => {
      expect(queryByTestId('location-city-French City 10')).toBeTruthy();
      expect(queryByTestId('location-city-French City 11')).toBeNull();
    });
  });

  it('should ignore stale city fetch responses after expanding another country', async () => {
    let resolveGermany!: (cities: string[]) => void;
    let resolveFrance!: (cities: string[]) => void;
    const germanyPromise = new Promise<string[]>((resolve) => {
      resolveGermany = resolve;
    });
    const francePromise = new Promise<string[]>((resolve) => {
      resolveFrance = resolve;
    });
    const onSelectionChange = vi.fn();
    const onCityFetch = vi.fn((country: string) => (country === 'Germany' ? germanyPromise : francePromise));

    const { getByTestId, queryByTestId, rerender } = render(LocationFilter, {
      props: {
        countries: ['Germany', 'France'],
        onCityFetch,
        onSelectionChange,
      },
    });

    await fireEvent.click(getByTestId('location-country-Germany'));
    await waitFor(() => expect(onCityFetch).toHaveBeenCalledWith('Germany', undefined));
    await fireEvent.click(getByTestId('location-country-France'));
    await waitFor(() => expect(onCityFetch).toHaveBeenCalledWith('France', undefined));
    await waitFor(() => expect(queryByTestId('location-city-French City 1')).toBeNull());

    resolveFrance(['French City 1']);
    await waitFor(() => expect(queryByTestId('location-city-French City 1')).toBeTruthy());
    await rerender({
      countries: ['Germany', 'France'],
      selectedCountry: 'France',
      selectedCity: 'French City 1',
      onCityFetch,
      onSelectionChange,
    });
    onSelectionChange.mockClear();

    resolveGermany(['German City 1']);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await waitFor(() => {
      expect(queryByTestId('location-city-French City 1')).toBeTruthy();
      expect(queryByTestId('location-city-German City 1')).toBeNull();
    });
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should ignore stale same-country city fetch responses after context changes', async () => {
    let resolveFirstGermany!: (cities: string[]) => void;
    let resolveSecondGermany!: (cities: string[]) => void;
    const firstGermanyPromise = new Promise<string[]>((resolve) => {
      resolveFirstGermany = resolve;
    });
    const secondGermanyPromise = new Promise<string[]>((resolve) => {
      resolveSecondGermany = resolve;
    });
    const germanyRequests = [firstGermanyPromise, secondGermanyPromise];
    const onCityFetch = vi.fn(() => germanyRequests.shift() ?? Promise.resolve([]));
    const onSelectionChange = vi.fn();

    const { queryByTestId, rerender } = render(LocationFilter, {
      props: {
        countries: ['Germany'],
        selectedCountry: 'Germany',
        selectedCity: 'Berlin',
        context: { takenAfter: '2026-01-01' },
        onCityFetch,
        onSelectionChange,
      },
    });

    await waitFor(() => expect(onCityFetch).toHaveBeenCalledTimes(1));
    await rerender({
      countries: ['Germany'],
      selectedCountry: 'Germany',
      selectedCity: 'Berlin',
      context: { takenAfter: '2026-02-01' },
      onCityFetch,
      onSelectionChange,
    });
    await waitFor(() => expect(onCityFetch).toHaveBeenCalledTimes(2));

    resolveSecondGermany(['Berlin']);
    await waitFor(() => expect(queryByTestId('location-city-Berlin')).toBeTruthy());
    onSelectionChange.mockClear();

    resolveFirstGermany(['Munich']);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await waitFor(() => {
      expect(queryByTestId('location-city-Berlin')).toBeTruthy();
      expect(queryByTestId('location-city-Munich')).toBeNull();
    });
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should recover when a city fetch rejects and another country is selected', async () => {
    let rejectGermany!: (error: Error) => void;
    let resolveFrance!: (cities: string[]) => void;
    const germanyPromise = new Promise<string[]>((_, reject) => {
      rejectGermany = reject;
    });
    const francePromise = new Promise<string[]>((resolve) => {
      resolveFrance = resolve;
    });
    const onCityFetch = vi.fn((country: string) => (country === 'Germany' ? germanyPromise : francePromise));
    const onSelectionChange = vi.fn();

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany', 'France'],
        onCityFetch,
        onSelectionChange,
      },
    });

    await fireEvent.click(getByTestId('location-country-Germany'));
    await waitFor(() => expect(onCityFetch).toHaveBeenCalledWith('Germany', undefined));

    rejectGermany(new Error('city fetch failed'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    await fireEvent.click(getByTestId('location-country-France'));
    await waitFor(() => expect(onCityFetch).toHaveBeenCalledWith('France', undefined));

    resolveFrance(['Paris']);
    await waitFor(() => {
      expect(queryByTestId('location-city-Paris')).toBeTruthy();
      expect(queryByTestId('location-city-Munich')).toBeNull();
    });
    expect(onSelectionChange).toHaveBeenCalledWith('France', undefined);
  });

  it('should not render prior country cities when the next country fetch rejects', async () => {
    let resolveGermany!: (cities: string[]) => void;
    let rejectFrance!: (error: Error) => void;
    const germanyPromise = new Promise<string[]>((resolve) => {
      resolveGermany = resolve;
    });
    const francePromise = new Promise<string[]>((_, reject) => {
      rejectFrance = reject;
    });
    const onCityFetch = vi.fn((country: string) => (country === 'Germany' ? germanyPromise : francePromise));
    const onSelectionChange = vi.fn();

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany', 'France'],
        onCityFetch,
        onSelectionChange,
      },
    });

    await fireEvent.click(getByTestId('location-country-Germany'));
    await waitFor(() => expect(onCityFetch).toHaveBeenCalledWith('Germany', undefined));

    resolveGermany(['Munich']);
    await waitFor(() => expect(queryByTestId('location-city-Munich')).toBeTruthy());

    await fireEvent.click(getByTestId('location-country-France'));
    await waitFor(() => expect(onCityFetch).toHaveBeenCalledWith('France', undefined));
    onSelectionChange.mockClear();

    rejectFrance(new Error('city fetch failed'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    await waitFor(() => {
      expect(queryByTestId('location-city-Munich')).toBeNull();
      expect(getByTestId('location-country-France')).toBeTruthy();
    });
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should not show city-level show more for countries with no cities', async () => {
    const fetchPromise = Promise.resolve([]);
    const onCityFetch = vi.fn(() => fetchPromise);

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany'],
        onCityFetch,
        onSelectionChange: () => {},
      },
    });

    await fireEvent.click(getByTestId('location-country-Germany'));
    await waitFor(() => expect(onCityFetch).toHaveBeenCalledTimes(1));
    await fetchPromise;

    await waitFor(() => {
      expect(queryByTestId('location-city-show-more-Germany')).toBeNull();
    });
  });

  it('should auto-fill country when city is selected', async () => {
    let lastCountry: string | undefined;
    let lastCity: string | undefined;
    const onSelectionChange = (country?: string, city?: string) => {
      lastCountry = country;
      lastCity = city;
    };

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: mockCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange,
      },
    });

    // First expand Germany
    await fireEvent.click(getByTestId('location-country-Germany'));

    await waitFor(() => {
      expect(queryByTestId('location-city-Munich')).toBeTruthy();
    });

    // Select Munich — should auto-fill Germany
    await fireEvent.click(getByTestId('location-city-Munich'));
    expect(lastCountry).toBe('Germany');
    expect(lastCity).toBe('Munich');
  });

  it('should show empty message when no locations', () => {
    const { getByTestId } = render(LocationFilter, {
      props: {
        countries: [],
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    expect(getByTestId('location-empty').textContent).toBe('No locations found');
  });

  // --- Search tests ---
  const manyCountries = [
    'Argentina',
    'Australia',
    'Brazil',
    'Canada',
    'China',
    'France',
    'Germany',
    'India',
    'Italy',
    'Japan',
    'Mexico',
    'Spain',
  ];

  it('should filter countries via search input', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: manyCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    const searchInput = getByTestId('location-search-input');
    await fireEvent.input(searchInput, { target: { value: 'Ger' } });

    expect(queryByTestId('location-country-Germany')).toBeTruthy();
    expect(queryByTestId('location-country-France')).toBeNull();
    expect(queryByTestId('location-country-Italy')).toBeNull();
  });

  it('should not fetch all country cities for one-character searches', async () => {
    const onCityFetch = vi.fn(() => Promise.resolve([]));

    const { getByTestId } = render(LocationFilter, {
      props: {
        countries: manyCountries,
        onCityFetch,
        onSelectionChange: () => {},
      },
    });

    await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'a' } });
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(onCityFetch).not.toHaveBeenCalled();
  });

  it('should not use cached city matches for one-character searches', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany'],
        onCityFetch: () => Promise.resolve(['Berlin']),
        onSelectionChange: () => {},
      },
    });

    await fireEvent.click(getByTestId('location-country-Germany'));
    await waitFor(() => expect(queryByTestId('location-city-Berlin')).toBeTruthy());

    await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'b' } });

    expect(queryByTestId('location-country-Germany')).toBeNull();
    expect(queryByTestId('location-city-Berlin')).toBeNull();
    expect(getByTestId('location-no-results').textContent).toBe('No matching locations');
  });

  it('should search matching city names when the query also matches a country name', async () => {
    const cityMap: Record<string, string[]> = {
      Germany: [],
      Switzerland: ['Geneva'],
    };

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany', 'Switzerland'],
        onCityFetch: (country: string) => Promise.resolve(cityMap[country] ?? []),
        onSelectionChange: () => {},
      },
    });

    await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'ge' } });

    await waitFor(() => {
      expect(queryByTestId('location-country-Germany')).toBeTruthy();
      expect(queryByTestId('location-country-Switzerland')).toBeTruthy();
      expect(queryByTestId('location-city-Geneva')).toBeTruthy();
    });
  });

  it('should search city names and show matching cities under their country', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: mockCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'ber' } });

    await waitFor(() => {
      expect(queryByTestId('location-country-Germany')).toBeTruthy();
      expect(queryByTestId('location-city-Berlin')).toBeTruthy();
      expect(queryByTestId('location-country-Italy')).toBeNull();
      expect(queryByTestId('location-city-Munich')).toBeNull();
    });
  });

  it('should not show no-results while city search fetches are pending', async () => {
    let resolveSwitzerland!: (cities: string[]) => void;
    const switzerlandPromise = new Promise<string[]>((resolve) => {
      resolveSwitzerland = resolve;
    });
    const onCityFetch = vi.fn((country: string) =>
      country === 'Switzerland' ? switzerlandPromise : Promise.resolve([]),
    );

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany', 'Switzerland'],
        onCityFetch,
        onSelectionChange: () => {},
      },
    });

    await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'gene' } });
    await waitFor(() => expect(onCityFetch).toHaveBeenCalledWith('Switzerland', undefined));

    expect(queryByTestId('location-no-results')).toBeNull();

    resolveSwitzerland(['Geneva']);

    await waitFor(() => {
      expect(queryByTestId('location-country-Switzerland')).toBeTruthy();
      expect(queryByTestId('location-city-Geneva')).toBeTruthy();
      expect(queryByTestId('location-no-results')).toBeNull();
    });
  });

  it('should not show no-results before debounced city search fetches start', async () => {
    const onCityFetch = vi.fn(() => Promise.resolve([]));

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: ['Germany', 'Switzerland'],
        onCityFetch,
        onSelectionChange: () => {},
      },
    });

    await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'gene' } });

    expect(onCityFetch).not.toHaveBeenCalled();
    expect(queryByTestId('location-no-results')).toBeNull();
  });

  it('should refetch city search results when context changes with the same active query', async () => {
    const countries = ['Germany', 'Switzerland'];
    const onCityFetch = vi.fn((country: string, context?: { takenAfter?: string }) => {
      if (country === 'Switzerland' && context?.takenAfter === '2026-02-01') {
        return Promise.resolve(['Geneva']);
      }

      return Promise.resolve([]);
    });

    const { getByTestId, queryByTestId, rerender } = render(LocationFilter, {
      props: {
        countries,
        context: { takenAfter: '2026-01-01' },
        onCityFetch,
        onSelectionChange: () => {},
      },
    });

    await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'gene' } });
    await waitFor(() => expect(onCityFetch).toHaveBeenCalledWith('Switzerland', { takenAfter: '2026-01-01' }));
    await waitFor(() => expect(queryByTestId('location-no-results')).toBeTruthy());

    await rerender({
      countries,
      context: { takenAfter: '2026-02-01' },
      onCityFetch,
      onSelectionChange: () => {},
    });

    await waitFor(() => expect(onCityFetch).toHaveBeenCalledWith('Switzerland', { takenAfter: '2026-02-01' }));
    await waitFor(() => {
      expect(queryByTestId('location-country-Switzerland')).toBeTruthy();
      expect(queryByTestId('location-city-Geneva')).toBeTruthy();
    });
  });

  it('should find a city in a country beyond the initial country cap', async () => {
    const cityMap: Record<string, string[]> = {
      Mexico: ['Merida'],
    };

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: manyCountries,
        onCityFetch: (country: string) => Promise.resolve(cityMap[country] ?? []),
        onSelectionChange: () => {},
      },
    });

    expect(queryByTestId('location-country-Mexico')).toBeNull();

    await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'meri' } });

    await waitFor(() => {
      expect(queryByTestId('location-country-Mexico')).toBeTruthy();
      expect(queryByTestId('location-city-Merida')).toBeTruthy();
    });
  });

  it('should select a city from city search results', async () => {
    const onSelectionChange = vi.fn();

    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: mockCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange,
      },
    });

    await fireEvent.input(getByTestId('location-search-input'), { target: { value: 'ber' } });

    await waitFor(() => expect(queryByTestId('location-city-Berlin')).toBeTruthy());
    await fireEvent.click(getByTestId('location-city-Berlin'));

    expect(onSelectionChange).toHaveBeenLastCalledWith('Germany', 'Berlin');
  });

  it('should search case-insensitively', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: manyCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    const searchInput = getByTestId('location-search-input');
    await fireEvent.input(searchInput, { target: { value: 'germany' } });

    expect(queryByTestId('location-country-Germany')).toBeTruthy();
  });

  it('should show all search results without truncation', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: manyCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    const searchInput = getByTestId('location-search-input');
    // "an" matches 4 countries — all shown regardless of truncation
    await fireEvent.input(searchInput, { target: { value: 'an' } });

    expect(queryByTestId('location-country-Canada')).toBeTruthy();
    expect(queryByTestId('location-country-France')).toBeTruthy();
    expect(queryByTestId('location-country-Germany')).toBeTruthy();
    expect(queryByTestId('location-country-Japan')).toBeTruthy();
    // Non-matches hidden
    expect(queryByTestId('location-country-Argentina')).toBeNull();
    expect(queryByTestId('location-country-Brazil')).toBeNull();
    expect(queryByTestId('location-country-China')).toBeNull();
    expect(queryByTestId('location-country-Spain')).toBeNull();
  });

  it('should show "Show N more" when list exceeds 10 countries', () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: manyCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    // First 10 should be visible
    expect(queryByTestId('location-country-Argentina')).toBeTruthy();
    expect(queryByTestId('location-country-Japan')).toBeTruthy();
    // 11th and 12th should be hidden
    expect(queryByTestId('location-country-Mexico')).toBeNull();
    expect(queryByTestId('location-country-Spain')).toBeNull();

    const showMore = getByTestId('location-show-more');
    expect(showMore.textContent).toContain('Show 2 more');
  });

  it('should expand list when "Show N more" is clicked', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: manyCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    await fireEvent.click(getByTestId('location-show-more'));

    expect(queryByTestId('location-country-Mexico')).toBeTruthy();
    expect(queryByTestId('location-country-Spain')).toBeTruthy();
  });

  it('should show "No matching locations" for empty search results', async () => {
    const { getByTestId } = render(LocationFilter, {
      props: {
        countries: manyCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    const searchInput = getByTestId('location-search-input');
    await fireEvent.input(searchInput, { target: { value: 'zzzzz' } });

    await waitFor(() => expect(getByTestId('location-no-results').textContent).toBe('No matching locations'));
  });

  it('should show "No matching locations" immediately for one-character empty search results', async () => {
    const { getByTestId } = render(LocationFilter, {
      props: {
        countries: manyCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    const searchInput = getByTestId('location-search-input');
    await fireEvent.input(searchInput, { target: { value: 'q' } });

    expect(getByTestId('location-no-results').textContent).toBe('No matching locations');
  });

  it('should keep orphaned country visible during search', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: mockCountries, // Germany, Italy, France
        selectedCountry: 'Switzerland', // Not in list = orphaned
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    const searchInput = getByTestId('location-search-input');
    await fireEvent.input(searchInput, { target: { value: 'Italy' } });

    // Orphaned country still visible
    expect(queryByTestId('location-country-Switzerland')).toBeTruthy();
    // Matched country visible
    expect(queryByTestId('location-country-Italy')).toBeTruthy();
    // Non-matched countries hidden
    expect(queryByTestId('location-country-Germany')).toBeNull();
  });

  it('should keep selected country visible during search', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: mockCountries,
        selectedCountry: 'Germany',
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    const searchInput = getByTestId('location-search-input');

    await fireEvent.input(searchInput, { target: { value: 'Italy' } });
    expect(queryByTestId('location-country-Germany')).toBeTruthy();
    expect(queryByTestId('location-country-Italy')).toBeTruthy();

    await fireEvent.input(searchInput, { target: { value: '' } });
    expect(queryByTestId('location-country-Germany')).toBeTruthy();
  });

  it('should show cities when searching for a country and clicking it', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: mockCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    const searchInput = getByTestId('location-search-input');
    await fireEvent.input(searchInput, { target: { value: 'Germany' } });
    await fireEvent.click(getByTestId('location-country-Germany'));

    await waitFor(() => {
      expect(queryByTestId('location-city-Munich')).toBeTruthy();
      expect(queryByTestId('location-city-Berlin')).toBeTruthy();
      expect(queryByTestId('location-city-Hamburg')).toBeTruthy();
    });
  });

  it('should not show search input when no countries exist', () => {
    const { queryByTestId } = render(LocationFilter, {
      props: {
        countries: [],
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    expect(queryByTestId('location-search-input')).toBeNull();
    expect(queryByTestId('location-empty')).toBeTruthy();
  });

  it('should restore expanded country with cities after search is cleared', async () => {
    const { getByTestId, queryByTestId } = render(LocationFilter, {
      props: {
        countries: mockCountries,
        onCityFetch: mockCityFetch,
        onSelectionChange: () => {},
      },
    });

    // Select and expand Germany to load cities
    await fireEvent.click(getByTestId('location-country-Germany'));
    await waitFor(() => {
      expect(queryByTestId('location-city-Munich')).toBeTruthy();
    });

    // Search hides Germany (and its cities)
    const searchInput = getByTestId('location-search-input');
    await fireEvent.input(searchInput, { target: { value: 'Italy' } });
    expect(queryByTestId('location-country-Germany')).toBeNull();
    expect(queryByTestId('location-city-Munich')).toBeNull();

    // Clear search — Germany and cities reappear
    await fireEvent.input(searchInput, { target: { value: '' } });
    expect(queryByTestId('location-country-Germany')).toBeTruthy();
    await waitFor(() => {
      expect(queryByTestId('location-city-Munich')).toBeTruthy();
    });
  });
});

describe('CameraFilter', () => {
  const mockMakes = ['Canon', 'Sony', 'Nikon'];
  const mockModelFetch = (make: string): Promise<string[]> => {
    const modelMap: Record<string, string[]> = {
      Canon: ['EOS R5', 'EOS R6', 'EOS 5D'],
      Sony: ['A7 IV', 'A7R V'],
      Nikon: ['Z9', 'Z6 III'],
    };
    return Promise.resolve(modelMap[make] ?? []);
  };

  it('should render makes with radio buttons', () => {
    const { getByTestId } = render(CameraFilter, {
      props: {
        makes: mockMakes,
        onModelFetch: mockModelFetch,
        onSelectionChange: () => {},
      },
    });

    expect(getByTestId('camera-make-Canon')).toBeTruthy();
    expect(getByTestId('camera-make-Sony')).toBeTruthy();
    expect(getByTestId('camera-make-Nikon')).toBeTruthy();
  });

  it('should be single-select (selecting B deselects A)', async () => {
    let lastMake: string | undefined;
    const onSelectionChange = (make?: string) => {
      lastMake = make;
    };

    const { getByTestId } = render(CameraFilter, {
      props: {
        makes: mockMakes,
        onModelFetch: mockModelFetch,
        onSelectionChange,
      },
    });

    await fireEvent.click(getByTestId('camera-make-Canon'));
    expect(lastMake).toBe('Canon');

    await fireEvent.click(getByTestId('camera-make-Sony'));
    expect(lastMake).toBe('Sony');
  });

  it('should show models when make is expanded', async () => {
    const { getByTestId, queryByTestId } = render(CameraFilter, {
      props: {
        makes: mockMakes,
        onModelFetch: mockModelFetch,
        onSelectionChange: () => {},
      },
    });

    await fireEvent.click(getByTestId('camera-make-Canon'));

    await waitFor(() => {
      expect(queryByTestId('camera-model-EOS R5')).toBeTruthy();
      expect(queryByTestId('camera-model-EOS R6')).toBeTruthy();
      expect(queryByTestId('camera-model-EOS 5D')).toBeTruthy();
    });
  });

  it('should auto-fill make when model is selected', async () => {
    let lastMake: string | undefined;
    let lastModel: string | undefined;
    const onSelectionChange = (make?: string, model?: string) => {
      lastMake = make;
      lastModel = model;
    };

    const { getByTestId, queryByTestId } = render(CameraFilter, {
      props: {
        makes: mockMakes,
        onModelFetch: mockModelFetch,
        onSelectionChange,
      },
    });

    // Expand Canon
    await fireEvent.click(getByTestId('camera-make-Canon'));

    await waitFor(() => {
      expect(queryByTestId('camera-model-EOS R5')).toBeTruthy();
    });

    // Select a model — should auto-fill make
    await fireEvent.click(getByTestId('camera-model-EOS R5'));
    expect(lastMake).toBe('Canon');
    expect(lastModel).toBe('EOS R5');
  });

  it('should show empty message when no cameras', () => {
    const { getByTestId } = render(CameraFilter, {
      props: {
        makes: [],
        onModelFetch: mockModelFetch,
        onSelectionChange: () => {},
      },
    });

    expect(getByTestId('camera-empty').textContent).toBe('No cameras found');
  });
});

describe('storageKey prop', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should use custom storage key for localStorage persistence', async () => {
    const customKey = 'gallery-filter-photos';
    render(FilterPanel, {
      props: {
        config: { sections: ['rating', 'media', 'tags'], providers: {} },
        timeBuckets: [],
        storageKey: customKey,
      },
    });
    const ratingToggle = screen.getByTestId('section-toggle-rating');
    await fireEvent.click(ratingToggle);
    const stored = localStorage.getItem(customKey);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!) as string[];
    expect(parsed).not.toContain('rating');
    expect(localStorage.getItem('gallery-filter-visible-sections')).toBeNull();
  });

  it('should use default key when storageKey not provided', async () => {
    render(FilterPanel, {
      props: {
        config: { sections: ['rating', 'media'], providers: {} },
        timeBuckets: [],
      },
    });
    const ratingToggle = screen.getByTestId('section-toggle-rating');
    await fireEvent.click(ratingToggle);
    expect(localStorage.getItem('gallery-filter-visible-sections')).toBeTruthy();
  });
});
