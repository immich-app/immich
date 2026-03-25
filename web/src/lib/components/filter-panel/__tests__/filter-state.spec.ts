import { buildFilterContext, clearFilters, createFilterState, getActiveFilterCount } from '../filter-panel';

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

  it('should count selectedYear as an active filter', () => {
    const state = createFilterState();
    state.selectedYear = 2023;
    expect(getActiveFilterCount(state)).toBe(1);
  });

  it('should count selectedMonth as an active filter alongside selectedYear', () => {
    const state = createFilterState();
    state.selectedYear = 2023;
    state.selectedMonth = 8;
    expect(getActiveFilterCount(state)).toBe(1); // year+month counts as one temporal filter

    // Other filters should still count normally
    state.personIds = ['p1'];
    expect(getActiveFilterCount(state)).toBe(2);
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

describe('buildFilterContext', () => {
  it('should return undefined when no year is selected', () => {
    const state = createFilterState();
    expect(buildFilterContext(state)).toBeUndefined();
  });

  it('should return year range when only year is selected', () => {
    const state = createFilterState();
    state.selectedYear = 2023;
    const ctx = buildFilterContext(state);
    expect(ctx).toEqual({
      takenAfter: '2023-01-01T00:00:00.000Z',
      takenBefore: '2024-01-01T00:00:00.000Z',
    });
  });

  it('should return month range when year and month are selected', () => {
    const state = createFilterState();
    state.selectedYear = 2023;
    state.selectedMonth = 6;
    const ctx = buildFilterContext(state);
    expect(ctx).toEqual({
      takenAfter: '2023-06-01T00:00:00.000Z',
      takenBefore: '2023-07-01T00:00:00.000Z',
    });
  });

  it('should handle December correctly (rolls over to next year)', () => {
    const state = createFilterState();
    state.selectedYear = 2023;
    state.selectedMonth = 12;
    const ctx = buildFilterContext(state);
    expect(ctx).toEqual({
      takenAfter: '2023-12-01T00:00:00.000Z',
      takenBefore: '2024-01-01T00:00:00.000Z',
    });
  });

  it('should handle January correctly', () => {
    const state = createFilterState();
    state.selectedYear = 2023;
    state.selectedMonth = 1;
    const ctx = buildFilterContext(state);
    expect(ctx).toEqual({
      takenAfter: '2023-01-01T00:00:00.000Z',
      takenBefore: '2023-02-01T00:00:00.000Z',
    });
  });

  it('should use UTC dates (no timezone offset)', () => {
    const state = createFilterState();
    state.selectedYear = 2023;
    state.selectedMonth = 8;
    const ctx = buildFilterContext(state)!;
    expect(ctx.takenAfter).toContain('T00:00:00.000Z');
    expect(ctx.takenBefore).toContain('T00:00:00.000Z');
  });
});
