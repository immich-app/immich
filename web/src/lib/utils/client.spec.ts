import { queryClient } from '#lib/queries/client.ts';
import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';
import { init } from '#lib/utils/client.ts';
import { test } from '#test/unit/fixtures.ts';
import { MalformedResponseError } from '@immich/sdk';
import { describe, expect } from 'vitest';

describe('init', () => {
  test('rejects an html page served for an api call as a malformed response', async ({ api }) => {
    queryClient.removeQueries({ queryKey: getServerConfigQuery().queryKey, exact: true });
    api.on({ getServerConfig: () => ({ body: '<!doctype html><html></html>', contentType: 'text/html' }) });

    await expect(init(fetch)).rejects.toBeInstanceOf(MalformedResponseError);
  });
});
