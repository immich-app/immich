import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import FilterPanel from '../filter-panel.svelte';

describe('Cascade callbacks pass parent value', () => {
  it('should call cities provider with the selected country', async () => {
    const citiesFn = vi.fn().mockResolvedValue(['Berlin', 'Munich']);

    render(FilterPanel, {
      props: {
        config: {
          sections: ['location'],
          providers: {
            locations: () =>
              Promise.resolve([
                { value: 'Germany', type: 'country' as const },
                { value: 'France', type: 'country' as const },
              ]),
            cities: citiesFn,
          },
        },
        timeBuckets: [],
      },
    });

    // Wait for countries to load
    await waitFor(() => {
      expect(screen.getByTestId('location-country-Germany')).toBeTruthy();
    });

    // Click a country to trigger cascade fetch
    await fireEvent.click(screen.getByTestId('location-country-Germany'));

    await waitFor(() => {
      expect(citiesFn).toHaveBeenCalledWith('Germany', undefined);
    });
  });

  it('should call cameraModels provider with the selected make', async () => {
    const modelsFn = vi.fn().mockResolvedValue(['X-T5', 'X-H2']);

    render(FilterPanel, {
      props: {
        config: {
          sections: ['camera'],
          providers: {
            cameras: () =>
              Promise.resolve([
                { value: 'Fujifilm', type: 'make' as const },
                { value: 'Sony', type: 'make' as const },
              ]),
            cameraModels: modelsFn,
          },
        },
        timeBuckets: [],
      },
    });

    // Wait for makes to load
    await waitFor(() => {
      expect(screen.getByTestId('camera-make-Fujifilm')).toBeTruthy();
    });

    // Click a make to trigger cascade fetch
    await fireEvent.click(screen.getByTestId('camera-make-Fujifilm'));

    await waitFor(() => {
      expect(modelsFn).toHaveBeenCalledWith('Fujifilm', undefined);
    });
  });

  it('should not call cities provider when no cities provider is configured', async () => {
    render(FilterPanel, {
      props: {
        config: {
          sections: ['location'],
          providers: {
            locations: () => Promise.resolve([{ value: 'Germany', type: 'country' as const }]),
          },
        },
        timeBuckets: [],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-country-Germany')).toBeTruthy();
    });

    // Click country — should not throw even without cities provider
    await fireEvent.click(screen.getByTestId('location-country-Germany'));
  });

  it('should not call cameraModels provider when no cameraModels provider is configured', async () => {
    render(FilterPanel, {
      props: {
        config: {
          sections: ['camera'],
          providers: {
            cameras: () => Promise.resolve([{ value: 'Fujifilm', type: 'make' as const }]),
          },
        },
        timeBuckets: [],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('camera-make-Fujifilm')).toBeTruthy();
    });

    // Click make — should not throw even without cameraModels provider
    await fireEvent.click(screen.getByTestId('camera-make-Fujifilm'));
  });

  it('should pass different country when a different country is clicked', async () => {
    const citiesFn = vi.fn().mockResolvedValue([]);

    render(FilterPanel, {
      props: {
        config: {
          sections: ['location'],
          providers: {
            locations: () =>
              Promise.resolve([
                { value: 'Germany', type: 'country' as const },
                { value: 'France', type: 'country' as const },
              ]),
            cities: citiesFn,
          },
        },
        timeBuckets: [],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-country-France')).toBeTruthy();
    });

    await fireEvent.click(screen.getByTestId('location-country-France'));

    await waitFor(() => {
      expect(citiesFn).toHaveBeenCalledWith('France', undefined);
    });
    expect(citiesFn).not.toHaveBeenCalledWith('Germany', undefined);
  });
});
