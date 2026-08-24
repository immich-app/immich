import { addAssetsToAlbum as addToAlbum, BulkIdErrorReason } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import type { MessageFormatter } from 'svelte-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addAssetsToAlbums } from '$lib/services/album.service';
import { getFormatter } from '$lib/utils/i18n';

vi.mock('@immich/ui', () => ({
  toastManager: {
    info: vi.fn(),
    primary: vi.fn(),
    danger: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@immich/sdk');

vi.mock('$lib/utils/i18n', () => ({
  getFormatter: vi.fn(),
  getPreferredLocale: vi.fn(),
}));

vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: {
    params: {},
  },
}));

vi.mock('$lib/managers/event-manager.svelte', () => ({
  eventManager: {
    emit: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('$lib/utils/handle-error', () => ({
  handleError: vi.fn(),
}));

describe('AlbumService', () => {
  const albumId = 'album-1';
  const assetIds = ['asset-1', 'asset-2', 'asset-3'];

  const $t = vi.fn((key: string) => key) as unknown as MessageFormatter;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getFormatter).mockResolvedValue($t);
  });

  describe('addAssetsToAlbums', () => {
    it('should show an info toast when all assets are duplicates', async () => {
      vi.mocked(addToAlbum).mockResolvedValue([
        { id: 'asset-1', success: false, error: BulkIdErrorReason.Duplicate },
        { id: 'asset-2', success: false, error: BulkIdErrorReason.Duplicate },
        { id: 'asset-3', success: false, error: BulkIdErrorReason.Duplicate },
      ]);

      await addAssetsToAlbums([albumId], assetIds, { notify: true });

      expect(toastManager.info).toHaveBeenCalledWith(
        {
          description: 'assets_were_part_of_album_count',
          button: expect.objectContaining({
            label: 'view_album',
            onclick: expect.any(Function),
          }),
        },
        { timeout: 5000 },
      );

      expect(toastManager.primary).not.toHaveBeenCalled();
      expect(toastManager.danger).not.toHaveBeenCalled();
    });

    it('should show a primary toast when all assets are successfully added', async () => {
      vi.mocked(addToAlbum).mockResolvedValue([
        { id: 'asset-1', success: true },
        { id: 'asset-2', success: true },
        { id: 'asset-3', success: true },
      ]);

      await addAssetsToAlbums([albumId], assetIds, { notify: true });

      expect(toastManager.primary).toHaveBeenCalledWith(
        {
          description: 'assets_added_to_album_count',
          button: expect.objectContaining({
            label: 'view_album',
            onclick: expect.any(Function),
          }),
        },
        { timeout: 5000 },
      );

      expect(toastManager.info).not.toHaveBeenCalled();
      expect(toastManager.danger).not.toHaveBeenCalled();
    });

    it('should show a primary toast when some assets are successfully added', async () => {
      vi.mocked(addToAlbum).mockResolvedValue([
        { id: 'asset-1', success: true },
        { id: 'asset-2', success: true },
        { id: 'asset-3', success: false, error: BulkIdErrorReason.Unknown },
      ]);

      await addAssetsToAlbums([albumId], assetIds, { notify: true });

      expect(toastManager.primary).toHaveBeenCalledWith(
        {
          description: 'assets_added_to_album_partial_count',
          button: expect.objectContaining({
            label: 'view_album',
            onclick: expect.any(Function),
          }),
        },
        { timeout: 5000 },
      );

      expect(toastManager.info).not.toHaveBeenCalled();
      expect(toastManager.danger).not.toHaveBeenCalled();
    });

    it('should show a danger toast when no assets are successfully added', async () => {
      vi.mocked(addToAlbum).mockResolvedValue([
        { id: 'asset-1', success: false, error: BulkIdErrorReason.Unknown },
        { id: 'asset-2', success: false, error: BulkIdErrorReason.Unknown },
        { id: 'asset-3', success: false, error: BulkIdErrorReason.Unknown },
      ]);

      await addAssetsToAlbums([albumId], assetIds, { notify: true });

      expect(toastManager.danger).toHaveBeenCalledWith(
        {
          description: 'assets_cannot_be_added_to_album_count',
          button: expect.objectContaining({
            label: 'view_album',
            onclick: expect.any(Function),
          }),
        },
        { timeout: 5000 },
      );

      expect(toastManager.info).not.toHaveBeenCalled();
      expect(toastManager.primary).not.toHaveBeenCalled();
    });

    it('should not show a toast when notify is false', async () => {
      vi.mocked(addToAlbum).mockResolvedValue([
        { id: 'asset-1', success: true },
        { id: 'asset-2', success: true },
        { id: 'asset-3', success: true },
      ]);

      await addAssetsToAlbums([albumId], assetIds, { notify: false });

      expect(toastManager.info).not.toHaveBeenCalled();
      expect(toastManager.primary).not.toHaveBeenCalled();
      expect(toastManager.danger).not.toHaveBeenCalled();
      expect(toastManager.warning).not.toHaveBeenCalled();
    });
  });
});
