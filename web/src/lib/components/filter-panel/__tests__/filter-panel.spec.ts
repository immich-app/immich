import { fireEvent, render } from '@testing-library/svelte';
import { createFilterState } from '../filter-panel';
import FilterPanel from '../filter-panel.svelte';

describe('FilterPanel', () => {
  it('should render configured sections only', () => {
    const { queryByTestId } = render(FilterPanel, {
      props: {
        config: {
          sections: ['people', 'rating'],
          providers: {},
        },
        timeBuckets: [],
      },
    });
    expect(queryByTestId('filter-section-people')).toBeTruthy();
    expect(queryByTestId('filter-section-rating')).toBeTruthy();
    expect(queryByTestId('filter-section-location')).toBeNull();
    expect(queryByTestId('filter-section-camera')).toBeNull();
  });

  it('should hide sections not in config', () => {
    const { queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['rating'], providers: {} },
        timeBuckets: [],
      },
    });
    expect(queryByTestId('filter-section-people')).toBeNull();
    expect(queryByTestId('filter-section-location')).toBeNull();
    expect(queryByTestId('filter-section-camera')).toBeNull();
    expect(queryByTestId('filter-section-tags')).toBeNull();
    expect(queryByTestId('filter-section-media')).toBeNull();
    expect(queryByTestId('filter-section-rating')).toBeTruthy();
  });

  it('should collapse to icon strip', async () => {
    const { getByTestId, queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['people', 'location'], providers: {} },
        timeBuckets: [],
      },
    });
    const collapseBtn = getByTestId('collapse-panel-btn');
    await fireEvent.click(collapseBtn);
    expect(queryByTestId('collapsed-icon-strip')).toBeTruthy();
    expect(queryByTestId('discovery-panel')).toBeNull();
  });

  it('should expand from collapsed state', async () => {
    const { getByTestId, queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['people'], providers: {} },
        timeBuckets: [],
      },
    });
    // Collapse first
    await fireEvent.click(getByTestId('collapse-panel-btn'));
    expect(queryByTestId('collapsed-icon-strip')).toBeTruthy();
    // Expand
    await fireEvent.click(getByTestId('expand-panel-btn'));
    expect(queryByTestId('discovery-panel')).toBeTruthy();
    expect(queryByTestId('collapsed-icon-strip')).toBeNull();
  });

  it('should update filters when month is clicked in timeline picker', async () => {
    const { getByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['timeline'], providers: {} },
        timeBuckets: [
          { timeBucket: '2023-06-01', count: 100 },
          { timeBucket: '2023-08-01', count: 200 },
        ],
      },
    });
    await fireEvent.click(getByTestId('year-btn-2023'));
    await fireEvent.click(getByTestId('month-btn-6'));
    await fireEvent.click(getByTestId('collapse-panel-btn'));
    expect(getByTestId('collapsed-icon-strip')).toBeTruthy();
  });

  it('should update filters when year is clicked in timeline picker', async () => {
    const { getByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['timeline'], providers: {} },
        timeBuckets: [
          { timeBucket: '2023-06-01', count: 100 },
          { timeBucket: '2023-08-01', count: 200 },
        ],
      },
    });
    await fireEvent.click(getByTestId('year-btn-2023'));
    expect(getByTestId('discovery-panel')).toBeTruthy();
  });

  it('should render with externally-provided filters state', () => {
    const filters = createFilterState();
    filters.mediaType = 'image';
    const { queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['media'], providers: {} },
        timeBuckets: [],
        filters,
      },
    });
    expect(queryByTestId('filter-section-media')).toBeTruthy();
  });

  it('should work without onFilterChange callback', () => {
    const { queryByTestId } = render(FilterPanel, {
      props: {
        config: { sections: ['rating'], providers: {} },
        timeBuckets: [],
      },
    });
    expect(queryByTestId('filter-section-rating')).toBeTruthy();
  });
});
