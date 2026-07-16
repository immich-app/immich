import { AssetMediaStatus, type AssetMediaResponseDto, type UserAdminResponseDto } from '@immich/sdk';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { uploadManager } from '$lib/managers/upload-manager.svelte';
import { uploadAssetsStore } from '$lib/stores/upload';
import { UploadState } from '$lib/types';
import * as utils from '$lib/utils';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { fileUploadHandler } from './file-uploader';

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

  describe('proxy body size limits', () => {
    it('should retry as a streaming upload when a proxy rejects the body with 413', async () => {
      vi.spyOn(utils, 'supportsStreamingUpload').mockReturnValue(true);
      const uploadSpy = vi
        .spyOn(utils, 'uploadRequest')
        .mockRejectedValue(new utils.ApiError('Payload Too Large', 413, ''));
      const streamingSpy = vi
        .spyOn(utils, 'uploadRequestStreaming')
        .mockResolvedValue({ status: 201, data: mockUploadResponse });

      await fileUploadHandler({ files: [mockFile] });

      expect(uploadSpy).toHaveBeenCalled();
      expect(streamingSpy).toHaveBeenCalled();
      const items = get(uploadAssetsStore);
      expect(items[0].state).toBe(UploadState.DONE);
    });

    it('should not retry as a streaming upload for other errors', async () => {
      vi.spyOn(utils, 'supportsStreamingUpload').mockReturnValue(true);
      vi.spyOn(utils, 'uploadRequest').mockRejectedValue(new utils.ApiError('Internal Server Error', 500, ''));
      const streamingSpy = vi.spyOn(utils, 'uploadRequestStreaming');

      await fileUploadHandler({ files: [mockFile] });

      expect(streamingSpy).not.toHaveBeenCalled();
      const items = get(uploadAssetsStore);
      expect(items[0].state).toBe(UploadState.ERROR);
    });
  });
});
