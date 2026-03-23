import { clearFilters, createFilterState, getActiveFilterCount } from '../filter-panel';

describe('FilterState utilities', () => {
  it('should create default state', () => {
    const state = createFilterState();
    expect(state.personIds).toEqual([]);
    expect(state.tagIds).toEqual([]);
    expect(state.mediaType).toBe('all');
    expect(state.sortOrder).toBe('desc');
    expect(state.city).toBeUndefined();
    expect(state.rating).toBeUndefined();
  });

  it('should create default state with selectedYear and selectedMonth undefined', () => {
    const state = createFilterState();
    expect(state.selectedYear).toBeUndefined();
    expect(state.selectedMonth).toBeUndefined();
  });

  it('should allow setting selectedYear and selectedMonth', () => {
    const state = createFilterState();
    state.selectedYear = 2023;
    state.selectedMonth = 8;
    expect(state.selectedYear).toBe(2023);
    expect(state.selectedMonth).toBe(8);
  });

  it('should count active filters', () => {
    const state = createFilterState();
    expect(getActiveFilterCount(state)).toBe(0);

    state.personIds = ['p1'];
    expect(getActiveFilterCount(state)).toBe(1);

    state.city = 'Munich';
    expect(getActiveFilterCount(state)).toBe(2);

    state.rating = 3;
    expect(getActiveFilterCount(state)).toBe(3);
  });

  it('should not count selectedYear or selectedMonth as active filters', () => {
    const state = createFilterState();
    state.selectedYear = 2023;
    expect(getActiveFilterCount(state)).toBe(0);

    state.selectedMonth = 8;
    expect(getActiveFilterCount(state)).toBe(0);

    // Other filters should still count normally
    state.personIds = ['p1'];
    expect(getActiveFilterCount(state)).toBe(1);
  });

  it('should not double-count country when city is set', () => {
    const state = createFilterState();
    state.country = 'Germany';
    state.city = 'Munich';
    // country + city should count as 1, not 2
    expect(getActiveFilterCount(state)).toBe(1);
  });

  it('should clear filters but preserve sortOrder', () => {
    const state = createFilterState();
    state.personIds = ['p1'];
    state.city = 'Munich';
    state.rating = 3;
    state.sortOrder = 'asc';

    const cleared = clearFilters(state);
    expect(cleared.personIds).toEqual([]);
    expect(cleared.city).toBeUndefined();
    expect(cleared.rating).toBeUndefined();
    expect(cleared.sortOrder).toBe('asc'); // preserved!
    expect(cleared.mediaType).toBe('all');
  });

  it('should clear selectedYear and selectedMonth on clearFilters', () => {
    const state = createFilterState();
    state.selectedYear = 2023;
    state.selectedMonth = 8;
    state.personIds = ['p1'];

    const cleared = clearFilters(state);
    expect(cleared.selectedYear).toBeUndefined();
    expect(cleared.selectedMonth).toBeUndefined();
    expect(cleared.personIds).toEqual([]);
  });
});
