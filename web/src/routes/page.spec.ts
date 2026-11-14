import { queryClient } from '#lib/queries/client.ts';
import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';
import { lang } from '#lib/stores/preferences.store.ts';
import { test } from '#test/unit/fixtures.ts';
import { get } from 'svelte/store';
import { expect } from 'vitest';
import Page from './+page.svelte';
import { load } from './+page.ts';

test('starts the database restore flow', async ({ data, render, settle, api, app }) => {
  const previous = get(lang);
  lang.set('dev');
  document.cookie = 'immich_is_authenticated=; max-age=0';
  data.serverConfig.isInitialized = false;
  await queryClient.refetchQueries({ queryKey: getServerConfigQuery().queryKey, exact: true });

  try {
    await render(Page, load);

    await app.maintenanceMode.restoreFromBackupButton.click();
    await settle();

    expect(api.startDatabaseRestoreFlow).toHaveBeenCalled();
  } finally {
    lang.set(previous);
  }
});
