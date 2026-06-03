import {
  AssetMediaStatus,
  createAlbum,
  getAllAlbums,
  type AssetMediaResponseDto,
  type UserAdminResponseDto,
} from '@immich/sdk';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { uploadManager } from '$lib/managers/upload-manager.svelte';
import { addAssetsToAlbums } from '$lib/services/album.service';
import { uploadAssetsStore } from '$lib/stores/upload';
import { UploadState } from '$lib/types';
import * as utils from '$lib/utils';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { fileUploadHandler } from './file-uploader';

vi.mock('@immich/sdk', async () => {
  const sdk = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...sdk,
    createAlbum: vi.fn(),
    getAllAlbums: vi.fn(),
  };
});

vi.mock('$lib/services/album.service', () => ({
  addAssetsToAlbums: vi.fn(),
}));

describe('fileUploader error handling', () => {
  const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
  const mockUserObject = { id: 'user-123', email: 'test@example.com' } as UserAdminResponseDto;
  const mockError = new Error('Upload failed');
  const mockUploadResponse = { id: 'mock-id', status: AssetMediaStatus.Created } as AssetMediaResponseDto;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(uploadManager, 'getExtensions').mockReturnValue(['.jpg']);
    uploadAssetsStore.reset();
    authManager.reset();
  });

  for (const [name, mockUser] of [
    ['logged-in users', true],
    ['anonymous users', false],
  ] as const) {
    describe(`for ${name}`, () => {
      beforeEach(() => {
        if (mockUser) {
          authManager.setUser(mockUserObject);
        }
      });

      it(`should transition successful uploads to done`, async () => {
        vi.spyOn(utils, 'uploadRequest').mockResolvedValue({ status: 200, data: mockUploadResponse });

        await fileUploadHandler({ files: [mockFile] });

        const items = get(uploadAssetsStore);
        expect(items.length).toBe(1);
        expect(items[0].state).toBe(UploadState.DONE);
      });

      it('should capture errors', async () => {
        vi.spyOn(utils, 'uploadRequest').mockRejectedValue(mockError);

        await fileUploadHandler({ files: [mockFile] });

        const items = get(uploadAssetsStore);
        expect(items.length).toBe(1);
        expect(items[0].state).toBe(UploadState.ERROR);
      });
    });
  }

  it('should suppress errors on logout', async () => {
    authManager.setUser(mockUserObject);
    authManager.setPreferences(preferencesFactory.build());
    vi.spyOn(utils, 'uploadRequest').mockImplementationOnce(() => {
      authManager.reset();
      return Promise.reject(mockError);
    });

    await fileUploadHandler({ files: [mockFile] });

    const items = get(uploadAssetsStore);
    expect(items.length).toBe(1);
    expect(items[0].state).toBe(UploadState.STARTED);
  });

  describe('folder albums', () => {
    const createFolderFile = (path: string) => {
      const file = new File(['content'], path.split('/').at(-1)!, { type: 'image/jpeg' });
      Object.defineProperty(file, 'webkitRelativePath', { value: path });
      return file;
    };

    beforeEach(() => {
      vi.spyOn(utils, 'uploadRequest').mockResolvedValue({ status: 200, data: mockUploadResponse });
      vi.mocked(getAllAlbums).mockResolvedValue([]);
    });

    it('reuses an existing album matching the root folder name', async () => {
      vi.mocked(getAllAlbums).mockResolvedValueOnce([{ id: 'existing-album', albumName: 'Vacation' }] as Awaited<
        ReturnType<typeof getAllAlbums>
      >);

      await fileUploadHandler({
        files: [createFolderFile('Vacation/day-one/photo.jpg')],
        albumNameFromFolder: true,
      });

      expect(createAlbum).not.toHaveBeenCalled();
      expect(get(uploadAssetsStore)[0].albumId).toBe('existing-album');
      expect(addAssetsToAlbums).toHaveBeenCalledWith(['existing-album'], ['mock-id'], { notify: false });
    });

    it('creates an album for a new root folder name', async () => {
      vi.mocked(createAlbum).mockResolvedValue({ id: 'new-album', albumName: 'Vacation' } as never);

      await fileUploadHandler({
        files: [createFolderFile('Vacation/photo.jpg')],
        albumNameFromFolder: true,
      });

      expect(createAlbum).toHaveBeenCalledWith({ createAlbumDto: { albumName: 'Vacation' } });
      expect(get(uploadAssetsStore)[0].albumId).toBe('new-album');
      expect(addAssetsToAlbums).toHaveBeenCalledWith(['new-album'], ['mock-id'], { notify: false });
    });
  });
});
