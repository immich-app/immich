import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
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

  describe('initialCollapsed prop', () => {
    it('should start collapsed when initialCollapsed is true', () => {
      render(FilterPanel, {
        props: {
          config: { sections: ['rating', 'media'], providers: {} },
          timeBuckets: [],
          initialCollapsed: true,
        },
      });
      expect(screen.getByTestId('collapsed-icon-strip')).toBeInTheDocument();
      expect(screen.queryByTestId('discovery-panel')).not.toBeInTheDocument();
    });

    it('should start expanded by default (no prop)', () => {
      render(FilterPanel, {
        props: {
          config: { sections: ['rating', 'media'], providers: {} },
          timeBuckets: [],
        },
      });
      expect(screen.getByTestId('discovery-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('collapsed-icon-strip')).not.toBeInTheDocument();
    });
  });

  describe('emptyText prop', () => {
    it('should show generic empty text for people section when no people', async () => {
      render(FilterPanel, {
        props: {
          config: { sections: ['people'], providers: { people: () => Promise.resolve([]) } },
          timeBuckets: [],
        },
      });
      await waitFor(() => {
        expect(screen.getByTestId('people-empty')).toHaveTextContent('No people found');
      });
    });

    it('should show generic empty text for location section when no locations', async () => {
      render(FilterPanel, {
        props: {
          config: { sections: ['location'], providers: { locations: () => Promise.resolve([]) } },
          timeBuckets: [],
        },
      });
      await waitFor(() => {
        expect(screen.getByTestId('location-empty')).toHaveTextContent('No locations found');
      });
    });

    it('should show generic empty text for camera section when no cameras', async () => {
      render(FilterPanel, {
        props: {
          config: { sections: ['camera'], providers: { cameras: () => Promise.resolve([]) } },
          timeBuckets: [],
        },
      });
      await waitFor(() => {
        expect(screen.getByTestId('camera-empty')).toHaveTextContent('No cameras found');
      });
    });
  });
});

describe('Section Selector', () => {
  const STORAGE_KEY = 'gallery-filter-visible-sections';
  const allSections = ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'] as const;

  function renderPanel(
    sections: Array<(typeof allSections)[number]> = [...allSections],
    filters?: ReturnType<typeof createFilterState>,
  ) {
    return render(FilterPanel, {
      props: {
        config: { sections: [...sections], providers: {} },
        timeBuckets: sections.includes('timeline')
          ? [
              { timeBucket: '2023-06-01', count: 100 },
              { timeBucket: '2023-08-01', count: 200 },
            ]
          : [],
        ...(filters ? { filters } : {}),
      },
    });
  }

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  // --- Rendering ---

  // Test 1
  it('should render toggle row with icons for all configured sections', () => {
    renderPanel();
    expect(screen.getByTestId('section-toggle-row')).toBeTruthy();
    for (const section of allSections) {
      expect(screen.getByTestId(`section-toggle-${section}`)).toBeTruthy();
    }
  });

  // Test 2
  it('should not render toggle icons for unconfigured sections', () => {
    renderPanel(['people', 'rating']);
    expect(screen.getByTestId('section-toggle-people')).toBeTruthy();
    expect(screen.getByTestId('section-toggle-rating')).toBeTruthy();
    expect(screen.queryByTestId('section-toggle-location')).toBeNull();
    expect(screen.queryByTestId('section-toggle-camera')).toBeNull();
    expect(screen.queryByTestId('section-toggle-tags')).toBeNull();
    expect(screen.queryByTestId('section-toggle-timeline')).toBeNull();
    expect(screen.queryByTestId('section-toggle-media')).toBeNull();
  });

  // Test 3
  it('should show all sections visible by default when no localStorage value', () => {
    renderPanel();
    for (const section of allSections) {
      expect(screen.getByTestId(`filter-section-${section}`)).toBeTruthy();
    }
  });

  // Test 4
  it('should not render toggle row in collapsed panel state', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('collapse-panel-btn'));
    expect(screen.queryByTestId('section-toggle-row')).toBeNull();
    expect(screen.getByTestId('collapsed-icon-strip')).toBeTruthy();
  });

  // Test 5
  it('should not crash and not render toggle row with empty sections config', () => {
    renderPanel([]);
    expect(screen.queryByTestId('section-toggle-row')).toBeNull();
  });

  // --- Toggle Interaction ---

  // Test 6
  it('should hide section from DOM when active icon is clicked', async () => {
    renderPanel();
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
  });

  // Test 7
  it('should restore section to DOM when inactive icon is clicked', async () => {
    renderPanel();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
  });

  // Test 8
  it('should not affect other sections when one is toggled', async () => {
    renderPanel();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.getByTestId('filter-section-location')).toBeTruthy();
    expect(screen.getByTestId('filter-section-camera')).toBeTruthy();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
  });

  // Test 9
  it('should allow multiple sections to be hidden simultaneously', async () => {
    renderPanel();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    await fireEvent.click(screen.getByTestId('section-toggle-location'));
    await fireEvent.click(screen.getByTestId('section-toggle-camera'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.queryByTestId('filter-section-location')).toBeNull();
    expect(screen.queryByTestId('filter-section-camera')).toBeNull();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
    expect(screen.getByTestId('filter-section-tags')).toBeTruthy();
  });

  // Test 10
  it('should return to original state after rapid double-click', async () => {
    renderPanel();
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
  });

  // Test 11
  it('should trigger all-hidden state when single section is hidden', async () => {
    renderPanel(['rating']);
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('section-toggle-rating'));
    expect(screen.queryByTestId('filter-section-rating')).toBeNull();
    expect(screen.getByTestId('show-all-sections')).toBeTruthy();
  });

  // --- All-Hidden Empty State ---

  // Test 12
  it('should show empty state with "Show all" link when all sections hidden', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    await fireEvent.click(screen.getByTestId('section-toggle-rating'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.queryByTestId('filter-section-rating')).toBeNull();
    expect(screen.getByTestId('show-all-sections')).toBeTruthy();
  });

  // Test 13
  it('should restore all sections when "Show all" is clicked', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    await fireEvent.click(screen.getByTestId('section-toggle-rating'));
    expect(screen.getByTestId('show-all-sections')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('show-all-sections'));
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
    expect(screen.queryByTestId('show-all-sections')).toBeNull();
  });

  // Test 14
  it('should update all toggle icons to active/pressed after "Show all"', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    await fireEvent.click(screen.getByTestId('section-toggle-rating'));
    await fireEvent.click(screen.getByTestId('show-all-sections'));
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('section-toggle-rating').getAttribute('aria-pressed')).toBe('true');
  });

  // --- Active-but-Hidden Indicator ---

  // Test 15
  it('should show dot indicator on hidden section with active filter', async () => {
    const filters = createFilterState();
    filters.personIds = ['person-1'];
    renderPanel(['people', 'rating'], filters);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('section-toggle-dot-people')).toBeTruthy();
  });

  // Test 16
  it('should not show dot indicator on hidden section without active filter', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.queryByTestId('section-toggle-dot-people')).toBeNull();
  });

  // Test 17
  it('should show dot on timeline section with selectedYear when hidden', async () => {
    const filters = createFilterState();
    filters.selectedYear = 2023;
    renderPanel(['timeline', 'rating'], filters);
    await fireEvent.click(screen.getByTestId('section-toggle-timeline'));
    expect(screen.getByTestId('section-toggle-dot-timeline')).toBeTruthy();
  });

  // --- Accessibility ---

  // Test 18
  it('should set aria-pressed="true" on visible section toggle icons', () => {
    renderPanel(['people', 'rating']);
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('section-toggle-rating').getAttribute('aria-pressed')).toBe('true');
  });

  // Test 19
  it('should set aria-pressed="false" on hidden section toggle icons', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('section-toggle-rating').getAttribute('aria-pressed')).toBe('true');
  });

  // Test 20
  it('should update aria-pressed correctly after toggle click', async () => {
    renderPanel(['people']);
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('true');
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('false');
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.getByTestId('section-toggle-people').getAttribute('aria-pressed')).toBe('true');
  });

  // --- localStorage Persistence ---

  // Test 21
  it('should write updated visibility to localStorage when section is toggled', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
    expect(stored).toContain('rating');
    expect(stored).not.toContain('people');
  });

  // Test 22
  it('should read localStorage on mount and restore visibility', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['rating']));
    renderPanel(['people', 'rating']);
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
  });

  // Test 23
  it('should show only stored sections when localStorage has partial list', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['people']));
    renderPanel();
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    expect(screen.queryByTestId('filter-section-rating')).toBeNull();
    expect(screen.queryByTestId('filter-section-location')).toBeNull();
  });

  // Test 24
  it('should ignore stale/unknown section names in localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['people', 'nonexistent', 'foobar']));
    renderPanel(['people', 'rating']);
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    expect(screen.queryByTestId('filter-section-rating')).toBeNull();
  });

  // Test 25
  it('should fall back to all-visible default when localStorage has invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json!!!');
    renderPanel(['people', 'rating']);
    expect(screen.getByTestId('filter-section-people')).toBeTruthy();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
  });

  // Test 26
  it('should use the correct localStorage key', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem('some-other-key')).toBeNull();
  });

  // --- State Preservation ---

  // Test 27
  it('should preserve visibility state across panel collapse/expand cycle', async () => {
    renderPanel(['people', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-people'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();

    // Collapse
    await fireEvent.click(screen.getByTestId('collapse-panel-btn'));
    expect(screen.getByTestId('collapsed-icon-strip')).toBeTruthy();

    // Expand
    await fireEvent.click(screen.getByTestId('expand-panel-btn'));
    expect(screen.queryByTestId('filter-section-people')).toBeNull();
    expect(screen.getByTestId('filter-section-rating')).toBeTruthy();
  });

  // Test 28
  it('should still allow filter interactions on visible sections (regression)', async () => {
    renderPanel(['timeline', 'rating']);
    await fireEvent.click(screen.getByTestId('section-toggle-rating'));
    expect(screen.queryByTestId('filter-section-rating')).toBeNull();
    // Timeline should still work
    expect(screen.getByTestId('filter-section-timeline')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('year-btn-2023'));
    expect(screen.getByTestId('filter-section-timeline')).toBeTruthy();
  });
});
