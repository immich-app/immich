import { fireEvent, render } from '@testing-library/svelte';
import ActiveFiltersBar from '../active-filters-bar.svelte';
import { createFilterState } from '../filter-panel';

describe('ActiveFiltersBar', () => {
  it('should render chip for person filter with name', () => {
    const filters = createFilterState();
    filters.personIds = ['p1'];

    const { getAllByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        personNames: new Map([['p1', 'Sarah Chen']]),
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const chips = getAllByTestId('active-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0].textContent).toContain('Sarah Chen');
  });

  it('should render chip for location as "City, Country"', () => {
    const filters = createFilterState();
    filters.city = 'Munich';
    filters.country = 'Germany';

    const { getAllByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const chips = getAllByTestId('active-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0].textContent).toContain('Munich, Germany');
  });

  it('should render chip for country only when no city', () => {
    const filters = createFilterState();
    filters.country = 'Germany';

    const { getAllByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const chips = getAllByTestId('active-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0].textContent).toContain('Germany');
    expect(chips[0].textContent).not.toContain(',');
  });

  it('should render chip for rating as "\u2605 3+"', () => {
    const filters = createFilterState();
    filters.rating = 3;

    const { getAllByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const chips = getAllByTestId('active-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0].textContent).toContain('\u2605 3+');
  });

  it('should render chip for media type as "Photos only"', () => {
    const filters = createFilterState();
    filters.mediaType = 'image';

    const { getAllByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const chips = getAllByTestId('active-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0].textContent).toContain('Photos only');
  });

  it('should render "Videos only" for video media type', () => {
    const filters = createFilterState();
    filters.mediaType = 'video';

    const { getAllByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const chips = getAllByTestId('active-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0].textContent).toContain('Videos only');
  });

  it('should render no chips when no filters active', () => {
    const filters = createFilterState();

    const { queryAllByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const chips = queryAllByTestId('active-chip');
    expect(chips).toHaveLength(0);
  });

  it('should remove individual filter on chip close', async () => {
    let removedType: string | undefined;
    let removedId: string | undefined;
    const onRemoveFilter = (type: string, id?: string) => {
      removedType = type;
      removedId = id;
    };

    const filters = createFilterState();
    filters.personIds = ['p1'];

    const { getByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        personNames: new Map([['p1', 'Sarah Chen']]),
        onRemoveFilter,
        onClearAll: () => {},
      },
    });

    await fireEvent.click(getByTestId('chip-close'));
    expect(removedType).toBe('person');
    expect(removedId).toBe('p1');
  });

  it('should clear all on Clear All click', async () => {
    let cleared = false;
    const onClearAll = () => {
      cleared = true;
    };

    const filters = createFilterState();
    filters.rating = 4;
    filters.mediaType = 'image';

    const { getByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        onRemoveFilter: () => {},
        onClearAll,
      },
    });

    await fireEvent.click(getByTestId('clear-all-btn'));
    expect(cleared).toBe(true);
  });

  it('should not clear sortOrder on Clear All', async () => {
    // This test verifies that the Clear All button does not affect sortOrder.
    // The bar component delegates to onClearAll, which should use clearFilters().
    // clearFilters() preserves sortOrder by design (tested in filter-state.spec.ts).
    // Here we just verify the bar does not modify sortOrder itself.
    const filters = createFilterState();
    filters.sortOrder = 'asc';
    filters.rating = 4;

    let cleared = false;
    const onClearAll = () => {
      cleared = true;
    };

    const { getByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        onRemoveFilter: () => {},
        onClearAll,
      },
    });

    await fireEvent.click(getByTestId('clear-all-btn'));
    expect(cleared).toBe(true);
    // sortOrder is unchanged because the component only calls the callback
    expect(filters.sortOrder).toBe('asc');
  });

  it('should show result count', () => {
    const filters = createFilterState();

    const { getByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        resultCount: 1234,
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const resultCount = getByTestId('result-count');
    expect(resultCount.textContent).toContain('1,234 results');
  });

  it('should render camera chip as "Make Model"', () => {
    const filters = createFilterState();
    filters.make = 'Canon';
    filters.model = 'EOS R5';

    const { getAllByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const chips = getAllByTestId('active-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0].textContent).toContain('Canon EOS R5');
  });

  it('should render tag chips with names', () => {
    const filters = createFilterState();
    filters.tagIds = ['t1', 't2'];

    const { getAllByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        tagNames: new Map([
          ['t1', 'Vacation'],
          ['t2', 'Family'],
        ]),
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const chips = getAllByTestId('active-chip');
    expect(chips).toHaveLength(2);
    expect(chips[0].textContent).toContain('Vacation');
    expect(chips[1].textContent).toContain('Family');
  });

  it('should not show Clear All when no filters active', () => {
    const filters = createFilterState();

    const { queryByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    expect(queryByTestId('clear-all-btn')).toBeNull();
  });

  it('should show singular "result" for count of 1', () => {
    const filters = createFilterState();

    const { getByTestId } = render(ActiveFiltersBar, {
      props: {
        filters,
        resultCount: 1,
        onRemoveFilter: () => {},
        onClearAll: () => {},
      },
    });

    const resultCount = getByTestId('result-count');
    expect(resultCount.textContent).toContain('1 result');
    expect(resultCount.textContent).not.toContain('results');
  });
});
