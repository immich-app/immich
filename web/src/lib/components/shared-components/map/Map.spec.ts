import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { LngLat, LngLatBounds, type Map as MapLibre } from 'maplibre-gl';
import { afterNavigate } from '$app/navigation';
import Map from './Map.svelte';

vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn() }));
vi.mock('$lib/managers/server-config-manager.svelte', () => ({
  serverConfigManager: { value: { mapLightStyleUrl: '', mapDarkStyleUrl: '' } },
}));
vi.mock('$lib/managers/asset-viewer-manager.svelte', () => ({ assetViewerManager: { isViewing: false } }));
vi.mock('svelte-maplibre', async () => {
  const { default: MapLibreTest } = await import('./MapLibreTest.svelte');
  return { MapLibre: MapLibreTest, GeoJSON: MapLibreTest, MarkerLayer: MapLibreTest };
});

describe('Map viewport selection', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => {
    vi.restoreAllMocks();
    history.replaceState(null, '', '/');
  });

  const setup = () => {
    const handlers = new globalThis.Map<string, () => void>();
    const map = {
      on: vi.fn((event: string, callback: () => void) => handlers.set(event, callback)),
      setMaxZoom: vi.fn(),
      setStyle: vi.fn(),
      resize: vi.fn(() => handlers.get('moveend')?.()),
      getCenter: vi.fn(() => new LngLat(7, 49)),
      getZoom: vi.fn(() => 4),
      getBearing: vi.fn(() => 0),
      getPitch: vi.fn(() => 0),
      getRoll: vi.fn(() => 0),
      getBounds: vi.fn(() => new LngLatBounds([0, 40], [15, 60])),
      getSource: vi.fn(() => ({
        getClusterLeaves: vi.fn().mockResolvedValue([
          { properties: { id: 'first' }, geometry: { type: 'Point', coordinates: [7, 49] } },
          { properties: { id: 'second' }, geometry: { type: 'Point', coordinates: [8, 50] } },
        ]),
      })),
    };
    const onClusterSelect = vi.fn();
    render(Map, {
      props: {
        mapMarkers: [],
        simplified: true,
        showSettings: false,
        showSimpleControls: false,
        viewportGridActive: true,
        onClusterSelect,
      },
      context: new globalThis.Map([['map', map as unknown as MapLibre]]),
    });
    return { map, handlers, onClusterSelect };
  };

  const selectCluster = async () => {
    await fireEvent.click(screen.getByRole('button', { name: 'Select cluster' }));
  };

  it('keeps the selected cluster when navigation resizes the map', async () => {
    const { map, onClusterSelect } = setup();
    await selectCluster();
    await waitFor(() => expect(onClusterSelect).toHaveBeenCalledWith(['first', 'second'], expect.any(Object)));
    onClusterSelect.mockClear();

    vi.mocked(afterNavigate).mock.calls.at(-1)![0]({ to: { url: new URL('http://localhost/map') } } as never);
    map.resize();

    expect(map.resize).toHaveBeenCalledTimes(2);
    expect(onClusterSelect).not.toHaveBeenCalled();
  });

  it.each([
    ['', 0],
    ['#4/49/7', 1],
  ] as const)('restores only the requested navigation hash "%s"', (hash, calls) => {
    setup();
    history.replaceState(null, '', '/map#4/49/7');
    const dispatchEvent = vi.spyOn(globalThis, 'dispatchEvent').mockReturnValue(true);

    vi.mocked(afterNavigate).mock.calls.at(-1)![0]({ to: { url: new URL(`http://localhost/map${hash}`) } } as never);

    expect(dispatchEvent).toHaveBeenCalledTimes(calls);
  });

  it('keeps the selected cluster through camera rounding after a resize', async () => {
    const { map, handlers, onClusterSelect } = setup();
    map.getCenter.mockReturnValue(new LngLat(7.000000000000682, 48.99999999999952));
    await selectCluster();
    await waitFor(() => expect(onClusterSelect).toHaveBeenCalledOnce());
    onClusterSelect.mockClear();

    map.getCenter.mockReturnValue(new LngLat(6.999999999999886, 48.999999999999915));
    map.getZoom.mockReturnValue(4.000000000000001);
    map.resize();
    map.getCenter.mockReturnValue(new LngLat(7, 49));
    map.getZoom.mockReturnValue(4);
    handlers.get('moveend')?.();

    expect(onClusterSelect).not.toHaveBeenCalled();
  });

  it.each(['getCenter', 'getZoom', 'getBearing', 'getPitch', 'getRoll'] as const)(
    'updates the visible photos when %s changes',
    async (property) => {
      const { map, handlers, onClusterSelect } = setup();
      await selectCluster();
      await waitFor(() => expect(onClusterSelect).toHaveBeenCalledOnce());
      onClusterSelect.mockClear();
      if (property === 'getCenter') {
        map.getCenter.mockReturnValue(new LngLat(8, 49));
      } else {
        map[property].mockReturnValue(10);
      }

      handlers.get('moveend')?.();

      expect(onClusterSelect).toHaveBeenCalledOnce();
      map.resize();
      expect(onClusterSelect).toHaveBeenCalledTimes(2);
    },
  );

  it('updates an area selection when the viewport is resized', () => {
    const { map, onClusterSelect } = setup();

    map.resize();

    expect(onClusterSelect).toHaveBeenCalledOnce();
  });
});
