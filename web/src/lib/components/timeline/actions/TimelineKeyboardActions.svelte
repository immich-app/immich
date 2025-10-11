<script lang="ts">
  import { goto } from '$app/navigation';
  import { ctrlKey, shiftKey } from '$lib/actions/input';
  import {
    Category,
    category,
    conditionalShortcut,
    registerShortcutVariant,
    shortcut,
    ShortcutVariant,
  } from '$lib/actions/shortcut.svelte';
  import DeleteAssetDialog from '$lib/components/photos-page/delete-asset-dialog.svelte';
  import ChangeDate, {
    type AbsoluteResult,
    type RelativeResult,
  } from '$lib/components/shared-components/change-date.svelte';
  import {
    setFocusToAsset as setFocusAssetInit,
    setFocusTo as setFocusToInit,
  } from '$lib/components/timeline/actions/focus-actions';
  import { AppRoute } from '$lib/constants';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { searchStore } from '$lib/stores/search.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets, updateStackedAssetInTimeline } from '$lib/utils/actions';
  import { archiveAssets, cancelMultiselect, selectAllAssets, stackAssets } from '$lib/utils/asset-utils';
  import { AssetVisibility } from '@immich/sdk';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    isShowDeleteConfirmation: boolean;
    onEscape?: () => void;
    scrollToAsset: (asset: TimelineAsset) => boolean;
  }

  let {
    timelineManager = $bindable(),
    assetInteraction,
    isShowDeleteConfirmation = $bindable(false),
    onEscape,
    scrollToAsset,
  }: Props = $props();

  let isShowSelectDate = $state(false);

  const trashOrDelete = async (force: boolean = false) => {
    isShowDeleteConfirmation = false;
    await deleteAssets(
      !(isTrashEnabled && !force),
      (assetIds) => timelineManager.removeAssets(assetIds),
      assetInteraction.selectedAssets,
      !isTrashEnabled || force ? undefined : (assets) => timelineManager.addAssets(assets),
    );
    assetInteraction.clearMultiselect();
  };

  const onDelete = () => {
    const hasTrashedAsset = assetInteraction.selectedAssets.some((asset) => asset.isTrashed);

    if ($showDeleteModal && (!isTrashEnabled || hasTrashedAsset)) {
      isShowDeleteConfirmation = true;
      return;
    }
    handlePromiseError(trashOrDelete(hasTrashedAsset));
  };

  const onForceDelete = () => {
    if ($showDeleteModal) {
      isShowDeleteConfirmation = true;
      return;
    }
    handlePromiseError(trashOrDelete(true));
  };

  const onStackAssets = async () => {
    const result = await stackAssets(assetInteraction.selectedAssets);

    updateStackedAssetInTimeline(timelineManager, result);

    onEscape?.();
  };

  const toggleArchive = async () => {
    const visibility = assetInteraction.isAllArchived ? AssetVisibility.Timeline : AssetVisibility.Archive;
    const ids = await archiveAssets(assetInteraction.selectedAssets, visibility);
    timelineManager.updateAssetOperation(ids, (asset) => {
      asset.visibility = visibility;
      return { remove: false };
    });
    deselectAllAssets();
  };

  let shiftKeyIsDown = $state(false);

  const deselectAllAssets = () => {
    cancelMultiselect(assetInteraction);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (searchStore.isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = true;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (searchStore.isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = false;
    }
  };

  const onSelectStart = (e: Event) => {
    if (assetInteraction.selectionActive && shiftKeyIsDown) {
      e.preventDefault();
    }
  };

  const isTrashEnabled = $derived($featureFlags.loaded && $featureFlags.trash);
  const isEmpty = $derived(timelineManager.isInitialized && timelineManager.months.length === 0);
  const idsSelectedAssets = $derived(assetInteraction.selectedAssets.map(({ id }) => id));

  $effect(() => {
    if (isEmpty) {
      assetInteraction.clearMultiselect();
    }
  });

  const setFocusTo = setFocusToInit.bind(undefined, scrollToAsset, timelineManager);
  const setFocusAsset = setFocusAssetInit.bind(undefined, scrollToAsset);
</script>

<svelte:document
  onkeydown={onKeyDown}
  onkeyup={onKeyUp}
  onselectstart={onSelectStart}
  {@attach shortcut('/', $t('explore'), () => goto(AppRoute.EXPLORE))}
  {@attach shortcut(ctrlKey('a'), category(Category.Selection, $t('select_all'), ShortcutVariant.SelectAll), () =>
    selectAllAssets(timelineManager, assetInteraction),
  )}
  {@attach conditionalShortcut(
    () => !!onEscape,
    () => shortcut('Escape', category(Category.Selection, $t('deselect_all'), ShortcutVariant.DeselectAll), onEscape!),
  )}
  {@attach registerShortcutVariant(ShortcutVariant.SelectAll, ShortcutVariant.DeselectAll)}
  {@attach shortcut('ArrowLeft', category(Category.Navigation, $t('move_left'), ShortcutVariant.NextAsset), () =>
    setFocusTo('later', 'asset'),
  )}
  {@attach shortcut('ArrowRight', category(Category.Navigation, $t('move_right'), ShortcutVariant.PreviousAsset), () =>
    setFocusTo('earlier', 'asset'),
  )}
  {@attach registerShortcutVariant(ShortcutVariant.NextAsset, ShortcutVariant.PreviousAsset)}
  {@attach shortcut('d', category(Category.Navigation, $t('previous_day'), ShortcutVariant.PreviousDay), () =>
    setFocusTo('earlier', 'day'),
  )}
  {@attach shortcut(shiftKey('d'), category(Category.Navigation, $t('next_day'), ShortcutVariant.NextDay), () =>
    setFocusTo('later', 'day'),
  )}
  {@attach registerShortcutVariant(ShortcutVariant.PreviousDay, ShortcutVariant.NextDay)}
  {@attach shortcut('m', category(Category.Navigation, $t('previous_month'), ShortcutVariant.PreviousMonth), () =>
    setFocusTo('earlier', 'day'),
  )}
  {@attach shortcut(shiftKey('m'), category(Category.Navigation, $t('next_month'), ShortcutVariant.NextMonth), () =>
    setFocusTo('later', 'day'),
  )}
  {@attach registerShortcutVariant(ShortcutVariant.PreviousMonth, ShortcutVariant.NextMonth)}
  {@attach shortcut('y', category(Category.Navigation, $t('previous_year'), ShortcutVariant.PreviousYear), () =>
    setFocusTo('earlier', 'year'),
  )}
  {@attach shortcut(shiftKey('y'), category(Category.Navigation, $t('next_year'), ShortcutVariant.NextYear), () =>
    setFocusTo('later', 'year'),
  )}
  {@attach registerShortcutVariant(ShortcutVariant.PreviousYear, ShortcutVariant.NextYear)}
  {@attach shortcut('g', category(Category.Navigation, $t('go_to_date')), () => (isShowSelectDate = true))}
  {@attach shortcut(
    'Delete',
    category(Category.Selection, isTrashEnabled ? $t('move_to_trash') : $t('delete'), ShortcutVariant.Trash),
    onDelete,
  )}
  {@attach shortcut(
    shiftKey('Delete'),
    category(Category.Selection, isTrashEnabled ? $t('delete_skip_trash') : $t('delete'), ShortcutVariant.Delete),
    onForceDelete,
  )}
  {@attach registerShortcutVariant(ShortcutVariant.Trash, ShortcutVariant.Delete)}
  {@attach shortcut('s', category(Category.Selection, $t('stack')), onStackAssets)}
  {@attach shortcut(shiftKey('a'), category(Category.Selection, $t('archive')), toggleArchive)}
/>

{#if isShowDeleteConfirmation}
  <DeleteAssetDialog
    size={idsSelectedAssets.length}
    onCancel={() => (isShowDeleteConfirmation = false)}
    onConfirm={() => handlePromiseError(trashOrDelete(true))}
  />
{/if}

{#if isShowSelectDate}
  <ChangeDate
    withDuration={false}
    title="Navigate to Time"
    initialDate={DateTime.now()}
    timezoneInput={false}
    onConfirm={async (dateString: AbsoluteResult | RelativeResult) => {
      isShowSelectDate = false;
      if (dateString.mode == 'absolute') {
        const asset = await timelineManager.getClosestAssetToDate(
          (DateTime.fromISO(dateString.date) as DateTime<true>).toObject(),
        );
        if (asset) {
          void setFocusAsset(asset);
        }
      }
    }}
    onCancel={() => (isShowSelectDate = false)}
  />
{/if}
