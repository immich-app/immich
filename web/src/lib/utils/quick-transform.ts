import { getAssetEdits, getAssetInfo, editAsset, removeAssetEdits, AssetEditAction, MirrorAxis } from '@immich/sdk';
import type { AssetEditActionItemDto } from '@immich/sdk';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { waitForWebsocketEvent } from '$lib/stores/websocket';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export type QuickTransform = { kind: 'rotate'; degrees: number } | { kind: 'mirror'; axis: MirrorAxis };

/**
 * Fold a new transform into the asset's existing edits.
 *
 * Rotations are summed and normalised so repeatedly rotating does not grow the
 * edit list, and a full turn collapses back to no rotation at all. Mirrors
 * toggle, so applying the same flip twice is an undo. Any other edit (a crop,
 * for example) is preserved untouched and stays ahead of the transforms.
 */
export const foldTransform = (
  existing: AssetEditActionItemDto[],
  transform: QuickTransform,
): AssetEditActionItemDto[] => {
  const others: AssetEditActionItemDto[] = [];
  const mirrors = new Set<MirrorAxis>();
  let rotation = 0;

  for (const edit of existing) {
    switch (edit.action) {
      case AssetEditAction.Rotate: {
        rotation += (edit.parameters as { angle: number }).angle ?? 0;
        break;
      }
      case AssetEditAction.Mirror: {
        const { axis } = edit.parameters as { axis: MirrorAxis };
        if (mirrors.has(axis)) {
          mirrors.delete(axis);
        } else {
          mirrors.add(axis);
        }
        break;
      }
      default: {
        // The GET response carries an `id` per edit; the create DTO does not
        // accept it, so pass through only the fields we are allowed to send.
        others.push({ action: edit.action, parameters: edit.parameters });
      }
    }
  }

  if (transform.kind === 'rotate') {
    rotation += transform.degrees;
  } else if (mirrors.has(transform.axis)) {
    mirrors.delete(transform.axis);
  } else {
    mirrors.add(transform.axis);
  }

  rotation = ((rotation % 360) + 360) % 360;

  const next = [...others];
  for (const axis of mirrors) {
    next.push({ action: AssetEditAction.Mirror, parameters: { axis } });
  }
  if (rotation !== 0) {
    next.push({ action: AssetEditAction.Rotate, parameters: { angle: rotation } });
  }
  return next;
};

/**
 * Apply a single rotate/flip to an asset without opening the editor.
 *
 * This goes through the same non-destructive edits API the editor uses, so the
 * change is visible there and can be reverted from there.
 */
export const applyQuickTransform = async (assetId: string, transform: QuickTransform) => {
  const $t = await getFormatter();
  try {
    const current = await getAssetEdits({ id: assetId });
    const edits = foldTransform(current.edits ?? [], transform);

    // Listen before sending, so a fast server cannot beat us to the event.
    const editReady = waitForWebsocketEvent('AssetEditReadyV2', (event) => event.asset.id === assetId, 10_000);

    await (edits.length === 0
      ? removeAssetEdits({ id: assetId })
      : editAsset({ id: assetId, assetEditsCreateDto: { edits } }));

    await editReady;

    // AssetEditsApplied only clears caches; it does not re-render anything.
    // The editor gets away with that because it closes afterwards, which makes
    // the viewer re-read the asset. Applying in place has no such moment, so
    // re-fetch and publish the asset: AssetUpdate is what actually refreshes
    // the open viewer and the timeline tile.
    eventManager.emit('AssetEditsApplied', assetId);
    const updated = await getAssetInfo({ id: assetId });
    eventManager.emit('AssetUpdate', updated);
  } catch (error) {
    handleError(error, $t('editor_edits_applied_error'));
  }
};
