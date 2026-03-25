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
