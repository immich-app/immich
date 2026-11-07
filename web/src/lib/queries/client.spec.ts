import { executeMutation, queryClient } from '#lib/queries/client.ts';
import { getAdminConfigQuery } from '#lib/queries/config-admin.query.ts';
import { getPublicConfigQuery } from '#lib/queries/config-public.query.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';
import { deleteTagMutation } from '#lib/queries/tag.query.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { QueryObserver, type QueryKey, type QueryObserverOptions } from '@tanstack/svelte-query';
import { noop } from 'lodash-es';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';

const ONE_HOUR = 60 * 60 * 1000;

const preloadThenIdle = async <TQueryFnData, TData, TQueryKey extends QueryKey>(
  options: QueryObserverOptions<TQueryFnData, Error, TData, TQueryFnData, TQueryKey>,
) => {
  queryClient.removeQueries({ queryKey: options.queryKey, exact: true });
  await queryClient.query(options);
  const unsubscribe = new QueryObserver(queryClient, options).subscribe(noop);
  unsubscribe();

  vi.advanceTimersByTime(ONE_HOUR);

  return queryClient.getQueryData(options.queryKey);
};

describe('queryClient', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('keeps query after its observers unmount and the app idles', () => {
    test('admin config', async ({ data }) => {
      await expect(preloadThenIdle(getAdminConfigQuery())).resolves.toEqual(data.adminConfig);
    });

    test('public config', async ({ data }) => {
      await expect(preloadThenIdle(getPublicConfigQuery())).resolves.toEqual(data.publicConfig);
    });

    test('user config', async ({ data }) => {
      await expect(preloadThenIdle(getUserConfigQuery())).resolves.toEqual(data.userConfig);
    });

    test('server config', async ({ data }) => {
      await expect(preloadThenIdle(getServerConfigQuery())).resolves.toEqual(data.serverConfig);
    });
  });
});

describe('executeMutation', () => {
  const confirm = { prompt: 'delete_tag_confirmation_prompt' };

  test('runs the mutation once the confirm is accepted', async ({ data, api, app, settle }) => {
    const tag = factory.tag();
    data.addTags(tag);
    const onSuccess = vi.fn<() => void>();

    const result = executeMutation(deleteTagMutation, [{ id: tag.id }], { confirm, onSuccess });
    await app.confirmButton.click();
    await result;
    await settle();

    expect(api.deleteTag).toHaveBeenCalledWith({ params: { id: tag.id } });
    expect(onSuccess).toHaveBeenCalled();
  });

  test('skips the mutation when the confirm is declined', async ({ data, api, app }) => {
    const tag = factory.tag();
    data.addTags(tag);
    const onSuccess = vi.fn<() => void>();

    const result = executeMutation(deleteTagMutation, [{ id: tag.id }], { confirm, onSuccess });
    await app.cancelButton.click();
    await result;

    expect(api.deleteTag).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
