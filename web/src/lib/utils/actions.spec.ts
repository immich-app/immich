import { deleteAssets, undoLastDelete } from '#lib/utils/actions.ts';
import { toTimelineAsset } from '#lib/utils/timeline-util.ts';
import { test } from '#test/unit/fixtures.ts';
import { toastManager } from '@immich/ui';
import { describe, expect, vi } from 'vitest';

describe('undoLastDelete', () => {
  test('restores the assets moved to the trash by the last delete', async ({ data, api }) => {
    const [asset] = data.addTimeline({ years: 1 });
    const timelineAsset = toTimelineAsset(asset);
    const onUndoDelete = vi.fn();

    await deleteAssets(false, vi.fn(), [timelineAsset], onUndoDelete);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
    expect(data.getAsset(asset.id)?.isTrashed).toBe(true);

    await expect(undoLastDelete()).resolves.toBe(true);
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
    expect(api.restoreAssets.calls).toHaveLength(1);
    expect(data.getAsset(asset.id)?.isTrashed).toBe(false);
    expect(onUndoDelete).toHaveBeenCalledExactlyOnceWith([timelineAsset]);

    await expect(undoLastDelete()).resolves.toBe(false);
  });

  test('undoes several deletes from the most recent one back', async ({ data, api }) => {
    const [first, second] = data.addTimeline({ years: 1 });

    await deleteAssets(false, vi.fn(), [toTimelineAsset(first)], vi.fn());
    await deleteAssets(false, vi.fn(), [toTimelineAsset(second)], vi.fn());
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [first.id], force: false } });
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [second.id], force: false } });

    await undoLastDelete();
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [second.id] } });
    expect(data.getAsset(second.id)?.isTrashed).toBe(false);
    expect(data.getAsset(first.id)?.isTrashed).toBe(true);

    await undoLastDelete();
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [first.id] } });
    expect(data.getAsset(first.id)?.isTrashed).toBe(false);
  });

  test('has nothing to undo after a permanent delete', async ({ data, api }) => {
    const [asset] = data.addTimeline({ years: 1 });

    await deleteAssets(true, vi.fn(), [toTimelineAsset(asset)], vi.fn());
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: true } });

    await expect(undoLastDelete()).resolves.toBe(false);
    expect(api.restoreAssets).not.toHaveBeenCalled();
    expect(data.getAsset(asset.id)).toBeUndefined();
  });

  test('does not undo a delete again once the toast button restored it', async ({ data, api }) => {
    const [asset] = data.addTimeline({ years: 1 });
    const onUndoDelete = vi.fn();
    const toast = vi.spyOn(toastManager, 'primary');

    await deleteAssets(false, vi.fn(), [toTimelineAsset(asset)], onUndoDelete);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
    const [options] = toast.mock.lastCall as unknown as [{ button: { onclick: () => Promise<void> } }];
    await options.button.onclick();
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });

    await expect(undoLastDelete()).resolves.toBe(false);
    expect(api.restoreAssets.calls).toHaveLength(1);
    expect(onUndoDelete).toHaveBeenCalledOnce();
  });

  test('keeps a delete undoable when restoring it fails', async ({ data, api, logger }) => {
    const [asset] = data.addTimeline({ years: 1 });
    const onUndoDelete = vi.fn();

    await deleteAssets(false, vi.fn(), [toTimelineAsset(asset)], onUndoDelete);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });

    api.on({ restoreAssets: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
    await expect(undoLastDelete()).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalledWith(/\[handleError\].*500/);
    expect(data.getAsset(asset.id)?.isTrashed).toBe(true);
    expect(onUndoDelete).not.toHaveBeenCalled();

    api.on({ restoreAssets: ({ body }) => ({ json: { count: data.restoreAssets(body.ids) } }) });
    await expect(undoLastDelete()).resolves.toBe(true);
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
    expect(api.restoreAssets.calls).toHaveLength(2);
    expect(data.getAsset(asset.id)?.isTrashed).toBe(false);
    expect(onUndoDelete).toHaveBeenCalledExactlyOnceWith([toTimelineAsset(asset)]);
  });

  test('retries a failed restore from the toast button', async ({ data, api, logger }) => {
    const [asset] = data.addTimeline({ years: 1 });
    const onUndoDelete = vi.fn();
    const toast = vi.spyOn(toastManager, 'primary');

    await deleteAssets(false, vi.fn(), [toTimelineAsset(asset)], onUndoDelete);
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [asset.id], force: false } });
    const [options] = toast.mock.lastCall as unknown as [{ button: { onclick: () => Promise<void> } }];

    api.on({ restoreAssets: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });
    await options.button.onclick();
    expect(logger.error).toHaveBeenCalledWith(/\[handleError\].*500/);
    expect(data.getAsset(asset.id)?.isTrashed).toBe(true);
    expect(onUndoDelete).not.toHaveBeenCalled();

    api.on({ restoreAssets: ({ body }) => ({ json: { count: data.restoreAssets(body.ids) } }) });
    await options.button.onclick();
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [asset.id] } });
    expect(api.restoreAssets.calls).toHaveLength(2);
    expect(data.getAsset(asset.id)?.isTrashed).toBe(false);
    expect(onUndoDelete).toHaveBeenCalledExactlyOnceWith([toTimelineAsset(asset)]);
    await expect(undoLastDelete()).resolves.toBe(false);
  });

  test('sends a second ctrl+z to the next older delete while a restore is in flight', async ({ data, api }) => {
    const [first, second] = data.addTimeline({ years: 1 });
    await deleteAssets(false, vi.fn(), [toTimelineAsset(first)], vi.fn());
    await deleteAssets(false, vi.fn(), [toTimelineAsset(second)], vi.fn());
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [first.id], force: false } });
    expect(api.deleteAssets).toHaveBeenCalledWith({ body: { ids: [second.id], force: false } });

    let release = () => {};
    let held = false;
    const gate = new Promise<void>((resolve) => (release = resolve));
    api.on({
      restoreAssets: async ({ body }) => {
        if (body.ids.includes(second.id) && !held) {
          held = true;
          await gate;
        }
        return { json: { count: data.restoreAssets(body.ids) } };
      },
    });

    const pending = undoLastDelete();
    await expect(undoLastDelete()).resolves.toBe(true);
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [second.id] } });
    expect(api.restoreAssets).toHaveBeenCalledWith({ body: { ids: [first.id] } });
    expect(data.getAsset(first.id)?.isTrashed).toBe(false);
    expect(data.getAsset(second.id)?.isTrashed).toBe(true);

    release();
    await expect(pending).resolves.toBe(true);
    expect(api.restoreAssets.calls).toHaveLength(2);
    expect(data.getAsset(second.id)?.isTrashed).toBe(false);
    await expect(undoLastDelete()).resolves.toBe(false);
  });
});
