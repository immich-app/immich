import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { uploadManager } from '#lib/managers/upload-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { uploadAssetsStore } from '#lib/stores/upload.ts';
import { UploadState } from '#lib/types.ts';
import { uploadRequest } from '#lib/utils.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { setPage } from '#test/unit/mocks/app-state.svelte.ts';
import { AssetMediaStatus, AssetUploadAction, type AssetMediaResponseDto } from '@immich/sdk';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, vi } from 'vitest';
import { fileUploadHandler, openFilePicker } from './file-uploader';

vi.mock('#lib/utils.ts', { spy: true });

describe('fileUploader error handling', () => {
  const newFile = () => new File(['content'], `${crypto.randomUUID()}.jpg`, { type: 'image/jpeg' });
  const mockUserObject = factory.user();
  const mockError = new Error('Upload failed');
  const mockUploadResponse = { id: 'mock-id', status: AssetMediaStatus.Created } as AssetMediaResponseDto;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(uploadManager, 'getExtensions').mockReturnValue(['.jpg']);
    uploadAssetsStore.reset();
    queryClient.clear();
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

      test(`should transition successful uploads to done`, async () => {
        vi.mocked(uploadRequest).mockResolvedValue({ status: 200, data: mockUploadResponse });

        await fileUploadHandler({ files: [newFile()] });

        const items = get(uploadAssetsStore);
        expect(items.length).toBe(1);
        expect(items[0].state).toBe(UploadState.DONE);
      });

      test('should capture errors', async ({ logger }) => {
        vi.mocked(uploadRequest).mockRejectedValue(mockError);

        await fileUploadHandler({ files: [newFile()] });

        const items = get(uploadAssetsStore);
        expect(items.length).toBe(1);
        expect(items[0].state).toBe(UploadState.ERROR);
        expect(logger.error).toHaveBeenCalledWith(/Upload failed/);
      });
    });
  }

  test('reports a duplicate without uploading it', async ({ api }) => {
    authManager.setUser(mockUserObject);
    const file = newFile();
    api.on({
      checkBulkUpload: () => ({
        json: {
          results: [{ id: file.name, action: AssetUploadAction.Reject, assetId: 'existing-id', isTrashed: true }],
        },
      }),
    });

    await fileUploadHandler({ files: [file] });

    const [item] = get(uploadAssetsStore);
    expect(item.state).toBe(UploadState.DUPLICATED);
    expect(item.assetId).toBe('existing-id');
    expect(item.isTrashed).toBe(true);
    expect(api.checkBulkUpload).toHaveBeenCalledWith({
      body: { assets: [{ id: file.name, checksum: expect.any(String) }] },
    });
    expect(uploadRequest).not.toHaveBeenCalled();
  });

  test('uploads the file when the duplicate check fails', async ({ api, logger }) => {
    authManager.setUser(mockUserObject);
    api.on({ checkBulkUpload: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
    vi.mocked(uploadRequest).mockResolvedValue({ status: 201, data: mockUploadResponse });

    await fileUploadHandler({ files: [newFile()] });

    const [item] = get(uploadAssetsStore);
    expect(item.state).toBe(UploadState.DONE);
    expect(uploadRequest).toHaveBeenCalled();
    expect(api.checkBulkUpload).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(/Error calculating sha1/);
    expect(logger.error).not.toHaveBeenCalledWith(/handleError/);
  });

  test('skips the duplicate check for shared links', async ({ api }) => {
    setPage({ route: { id: '/(user)/share/[key]/[[photos=photos]]/[[assetId=id]]' }, params: { key: 'shared-key' } });
    vi.mocked(uploadRequest).mockResolvedValue({ status: 201, data: mockUploadResponse });

    await fileUploadHandler({ files: [newFile()] });

    const [item] = get(uploadAssetsStore);
    expect(item.state).toBe(UploadState.DONE);
    expect(api.checkBulkUpload).not.toHaveBeenCalled();
  });

  test('should suppress errors on logout', async () => {
    authManager.setUser(mockUserObject);
    authManager.setPreferences(factory.preferences());
    vi.mocked(uploadRequest).mockImplementationOnce(() => {
      queryClient.clear();
      return Promise.reject(mockError);
    });

    await fileUploadHandler({ files: [newFile()] });

    const items = get(uploadAssetsStore);
    expect(items.length).toBe(1);
    expect(items[0].state).toBe(UploadState.STARTED);
  });
});

describe('openFilePicker', () => {
  test('attaches the file input to the document until files are chosen', async () => {
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const picked = openFilePicker({ extensions: ['.jpg'] });
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');

    expect(input).not.toBeNull();
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input!.files = transfer.files;
    input!.dispatchEvent(new Event('change'));

    await expect(picked).resolves.toEqual([file]);
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });
});
