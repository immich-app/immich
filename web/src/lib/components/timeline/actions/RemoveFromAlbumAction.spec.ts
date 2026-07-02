import { getAlbumInfo, removeAssetFromAlbum } from '@immich/sdk';
import { modalManager } from '@immich/ui';
import '@testing-library/jest-dom';
import { fireEvent, waitFor } from '@testing-library/svelte';
import { renderWithTooltips } from '$tests/helpers';
import { albumFactory } from '@test-data/factories/album-factory';
import RemoveFromAlbumAction from './RemoveFromAlbumAction.svelte';

vi.mock('@immich/sdk', async () => {
  const sdk = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...sdk,
    getAlbumInfo: vi.fn(),
    removeAssetFromAlbum: vi.fn(),
  };
});

describe('RemoveFromAlbumAction component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('asks for confirmation before removing a single asset with x', async () => {
    const album = albumFactory.build({ id: 'album-id' });
    vi.spyOn(modalManager, 'showDialog').mockResolvedValue(true);
    vi.mocked(removeAssetFromAlbum).mockResolvedValue([{ id: 'asset-id', success: true }]);
    vi.mocked(getAlbumInfo).mockResolvedValue(album);
    const onRemove = vi.fn();

    renderWithTooltips(RemoveFromAlbumAction, { album, onRemove, assetIds: ['asset-id'], menuItem: true });

    await fireEvent.keyDown(document, { key: 'x' });

    await waitFor(() => expect(modalManager.showDialog).toHaveBeenCalledOnce());
    expect(removeAssetFromAlbum).toHaveBeenCalledWith({ id: 'album-id', bulkIdsDto: { ids: ['asset-id'] } });
    expect(onRemove).toHaveBeenCalledWith(['asset-id']);
  });

  it('removes a single asset without confirmation with Shift+X', async () => {
    const album = albumFactory.build({ id: 'album-id' });
    vi.spyOn(modalManager, 'showDialog').mockResolvedValue(true);
    vi.mocked(removeAssetFromAlbum).mockResolvedValue([{ id: 'asset-id', success: true }]);
    vi.mocked(getAlbumInfo).mockResolvedValue(album);
    const onRemove = vi.fn();

    renderWithTooltips(RemoveFromAlbumAction, { album, onRemove, assetIds: ['asset-id'], menuItem: true });

    await fireEvent.keyDown(document, { key: 'X', shiftKey: true });

    await waitFor(() =>
      expect(removeAssetFromAlbum).toHaveBeenCalledWith({ id: 'album-id', bulkIdsDto: { ids: ['asset-id'] } }),
    );
    expect(modalManager.showDialog).not.toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalledWith(['asset-id']);
  });
});
