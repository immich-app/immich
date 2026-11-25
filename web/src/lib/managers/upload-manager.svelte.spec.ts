import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { uploadManager } from '#lib/managers/upload-manager.svelte.ts';
import { test } from '#test/unit/fixtures.ts';
import { beforeEach, describe, expect } from 'vitest';

describe('uploadManager', () => {
  beforeEach(() => {
    uploadManager.mediaTypes = { image: ['.jpg'], video: [], sidecar: [] };
  });

  test('loads the supported extensions on app init', async ({ data }) => {
    data.mediaTypes.image = ['.png'];
    data.mediaTypes.video = ['.mp4'];

    eventManager.emit('AppInit');

    await expect.poll(() => uploadManager.getExtensions()).toEqual(['.png', '.mp4']);
  });

  test('keeps the extensions when they fail to load', async ({ api, logger, settle }) => {
    api.on({ getSupportedMediaTypes: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });

    eventManager.emit('AppInit');
    await settle();

    expect(api.getSupportedMediaTypes).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(/Failed to load supported media types/);
    expect(uploadManager.getExtensions()).toEqual(['.jpg']);
  });
});
