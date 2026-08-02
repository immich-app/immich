import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { editAsset, getAssetEdits, getAssetInfo } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import DetailPanelFilmSimulation from './DetailPanelFilmSimulation.svelte';

vi.mock('@immich/sdk', async (importOriginal) => {
  const original = await importOriginal<typeof import('@immich/sdk')>();
  return {
    ...original,
    editAsset: vi.fn(),
    getAssetEdits: vi.fn(),
    getAssetInfo: vi.fn(),
  };
});

vi.mock('$lib/stores/websocket', () => ({ waitForWebsocketEvent: vi.fn().mockResolvedValue([]) }));

describe('DetailPanelFilmSimulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAssetEdits).mockResolvedValue({ assetId: 'asset-id', edits: [] });
    vi.mocked(editAsset).mockResolvedValue({ assetId: 'asset-id', edits: [] });
  });

  it('renders Classic Chrome as a code-native vector banner', () => {
    const { baseElement } = render(DetailPanelFilmSimulation, { filmMode: 'Classic Chrome' });
    const figure = baseElement.querySelector('[data-testid="film-simulation-graphic"]');

    expect(figure?.querySelector(':scope svg')).not.toBeNull();
    expect(figure?.querySelector(':scope img')).toBeNull();
    expect(figure?.querySelector(':scope .classic-chrome-monogram')?.textContent).toBe('CC');
    expect(figure?.querySelectorAll(':scope .vertical-detents line')).toHaveLength(25);
    expect(figure?.querySelectorAll(':scope .bottom-ticks line')).toHaveLength(27);
    expect(figure?.querySelector(':scope .horizontal-detent-highlight')).toBeNull();
  });

  it.each([
    'PROVIA/Standard',
    'Velvia/Vivid',
    'ASTIA/Soft',
    'REALA ACE',
    'Classic Neg.',
    'Nostalgic Neg.',
    'PRO Neg. Hi',
    'PRO Neg. Std',
    'ETERNA/Cinema',
    'ETERNA BLEACH BYPASS',
    'ACROS+Ye Filter',
    'MONOCHROME Red Filter',
    'SEPIA',
  ])('renders %s as a code-native identity banner', (filmMode) => {
    const { baseElement } = render(DetailPanelFilmSimulation, { filmMode });
    const figure = baseElement.querySelector('[data-testid="film-simulation-graphic"]');

    expect(figure?.querySelector(':scope svg')).not.toBeNull();
    expect(figure?.querySelector(':scope img')).toBeNull();
    expect(figure?.querySelectorAll(':scope .vertical-detents line')).toHaveLength(25);
    expect(figure?.querySelectorAll(':scope .bottom-ticks line')).toHaveLength(27);
    expect(figure?.querySelector(':scope .horizontal-detent-highlight')).toBeNull();
  });

  it('falls back to a text badge for an unknown film simulation', () => {
    const { getByText } = render(DetailPanelFilmSimulation, { filmMode: 'Future Film Mode' });

    expect(getByText('Future Film Mode')).toBeTruthy();
  });

  it('keeps the EXIF banner read-only for viewers who cannot edit the asset', () => {
    const asset = assetFactory.build({
      originalFileName: 'DXT51946.RAF',
      originalPath: '/photos/DXT51946.RAF',
      isOffline: false,
      exifInfo: { make: 'FUJIFILM', model: 'X-T5', filmMode: 'Nostalgic Neg.' },
    });
    const { queryByTestId } = render(DetailPanelFilmSimulation, {
      filmMode: 'Nostalgic Neg.',
      asset,
      isOwner: false,
    });

    expect(queryByTestId('fuji-raw-editor')).toBeNull();
    expect(getAssetEdits).not.toHaveBeenCalled();
  });

  it('immediately applies a selected simulation while retaining the level editor', async () => {
    const asset = assetFactory.build({
      id: 'asset-id',
      originalFileName: 'DXT51946.RAF',
      originalPath: '/photos/DXT51946.RAF',
      isOffline: false,
      exifInfo: { make: 'FUJIFILM', model: 'X-T5', filmMode: 'Nostalgic Neg.' },
    });
    vi.mocked(getAssetInfo).mockResolvedValue(asset);
    const { findByTestId, getByRole, getByText } = render(DetailPanelFilmSimulation, {
      filmMode: 'Nostalgic Neg.',
      asset,
      isOwner: true,
    });

    expect(await findByTestId('fuji-develop-levels')).toBeTruthy();
    await waitFor(() => expect(getByRole('button', { name: 'Choose' })).not.toBeDisabled());
    await fireEvent.click(getByRole('button', { name: 'Choose' }));
    await fireEvent.click(getByText('Velvia'));

    await waitFor(() => expect(editAsset).toHaveBeenCalledOnce());
    expect(vi.mocked(editAsset).mock.calls[0][0]).toMatchObject({
      id: 'asset-id',
      assetEditsCreateDto: {
        edits: [
          {
            action: 'fuji_develop',
            parameters: { profileSlug: 'velvia-vivid', processModel: 'lightroom-pv2012-independent-v6' },
          },
        ],
      },
    });
  });

  it('does not leave a new asset disabled while an earlier render is in flight', async () => {
    const assetA = assetFactory.build({
      id: 'asset-a',
      originalFileName: 'DXT51946.RAF',
      originalPath: '/photos/DXT51946.RAF',
      isOffline: false,
      exifInfo: { make: 'FUJIFILM', model: 'X-T5', filmMode: 'Nostalgic Neg.' },
    });
    const assetB = assetFactory.build({
      id: 'asset-b',
      originalFileName: 'DXT50894.RAF',
      originalPath: '/photos/DXT50894.RAF',
      isOffline: false,
      exifInfo: { make: 'FUJIFILM', model: 'X-T5', filmMode: 'PROVIA/Standard' },
    });
    let resolveEdit!: (value: Awaited<ReturnType<typeof editAsset>>) => void;
    const pendingEdit = new Promise<Awaited<ReturnType<typeof editAsset>>>((resolve) => (resolveEdit = resolve));
    vi.mocked(editAsset).mockReturnValue(pendingEdit);
    vi.mocked(getAssetInfo).mockResolvedValue(assetA);

    const { getByRole, getByText, rerender } = render(DetailPanelFilmSimulation, {
      filmMode: 'Nostalgic Neg.',
      asset: assetA,
      isOwner: true,
    });

    await waitFor(() => expect(getByRole('button', { name: 'Choose' })).not.toBeDisabled());
    await fireEvent.click(getByRole('button', { name: 'Choose' }));
    await fireEvent.click(getByText('Velvia'));
    await waitFor(() => expect(editAsset).toHaveBeenCalledOnce());

    await rerender({ filmMode: 'PROVIA/Standard', asset: assetB, isOwner: true });

    await waitFor(() => expect(getAssetEdits).toHaveBeenCalledWith({ id: 'asset-b' }));
    await waitFor(() => expect(getByRole('button', { name: 'Choose' })).not.toBeDisabled());

    resolveEdit({ assetId: assetA.id, edits: [] });
    await pendingEdit;
  });
});
