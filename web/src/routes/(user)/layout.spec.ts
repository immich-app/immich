import { deleteAssets, undoLastDelete } from '#lib/utils/actions.ts';
import { toTimelineAsset } from '#lib/utils/timeline-util.ts';
import { test } from '#test/unit/fixtures.ts';
import { setPage } from '#test/unit/mocks/app-state.svelte.ts';
import { expect, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import Layout from './+layout.svelte';

const photos = '/(user)/photos/[[assetId=id]]';

for (const key of ['Control', 'Meta']) {
  test(`${key}+z restores the assets trashed last`, async ({ data, api, render }) => {
    const [asset] = data.addTimeline({ years: 1 });
    const onUndoDelete = vi.fn();
    setPage({ route: { id: photos } });
    await render(Layout, () => Promise.resolve({}));

    await deleteAssets(false, vi.fn(), [toTimelineAsset(asset)], onUndoDelete);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });

    await userEvent.keyboard(`{${key}>}z{/${key}}`);

    await expect.poll(() => onUndoDelete.mock.calls).toHaveLength(1);
    expect(onUndoDelete).toHaveBeenCalledWith([toTimelineAsset(asset)]);
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
    expect(api.restoreAssets.calls).toHaveLength(1);
    expect(data.getAsset(asset.id)?.isTrashed).toBe(false);
  });
}

test('leaves ctrl+z to a text field that has the focus', async ({ data, api, render }) => {
  const [asset] = data.addTimeline({ years: 1 });
  setPage({ route: { id: photos } });
  await render(Layout, () => Promise.resolve({}));
  await deleteAssets(false, vi.fn(), [toTimelineAsset(asset)], vi.fn());
  expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });

  const input = document.createElement('input');
  document.body.append(input);
  try {
    input.focus();
    await userEvent.keyboard('{Control>}z{/Control}');
  } finally {
    input.remove();
  }

  await expect(undoLastDelete()).resolves.toBe(true);
  expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
  expect(api.restoreAssets.calls).toHaveLength(1);
  expect(data.getAsset(asset.id)?.isTrashed).toBe(false);
});
