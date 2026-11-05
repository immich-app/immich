import { test } from '#test/unit/fixtures.ts';
import { getAlbumInfo } from '@immich/sdk';
import { describe, expect } from 'vitest';
import { handleError } from './hooks.client.ts';

describe('handleError', () => {
  test('shows the server message for a failed api call', async ({ api, logger }) => {
    api.on({
      getAlbumInfo: () => ({ status: 400, json: { message: 'Not found or no album.read access', statusCode: 400 } }),
    });
    const error: unknown = await getAlbumInfo({ id: crypto.randomUUID() }).catch((error: unknown) => error);

    const result = await handleError({ kind: 'unknown', error, event: {} as never });

    expect(result).toMatchObject({ message: 'Not found or no album.read access', code: 400 });
    expect(logger.error).toHaveBeenCalledWith(/Not found or no album.read access/);
  });
});
