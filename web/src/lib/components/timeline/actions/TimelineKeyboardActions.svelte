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
  import {
    setFocusToAsset as setFocusAssetInit,
    setFocusTo as setFocusToInit,
  } from '$lib/components/timeline/actions/focus-actions';
  import { AppRoute } from '$lib/constants';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import NavigateToDateModal from '$lib/modals/NavigateToDateModal.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { searchStore } from '$lib/stores/search.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets, updateStackedAssetInTimeline } from '$lib/utils/actions';
  import { archiveAssets, cancelMultiselect, selectAllAssets, stackAssets } from '$lib/utils/asset-utils';
  import { AssetVisibility } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
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
    onEscape: handleEscape,
    scrollToAsset,
  }: Props = $props();

  let shiftKeyIsDown = $state(false);

  const isTrashEnabled = $derived($featureFlags.loaded && $featureFlags.trash);
  const isEmpty = $derived(timelineManager.isInitialized && timelineManager.months.length === 0);
  const idsSelectedAssets = $derived(assetInteraction.selectedAssets.map(({ id }) => id));

  const setFocusTo = setFocusToInit.bind(undefined, scrollToAsset, timelineManager);
  const setFocusAsset = setFocusAssetInit.bind(undefined, scrollToAsset);

  $effect(() => {
    if (isEmpty) {
      assetInteraction.clearMultiselect();
    }
  });

  // Event handlers
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

  const deselectAllAssets = () => {
    cancelMultiselect(assetInteraction);
  };

  // Shortcut handlers
  const handleExploreNavigation = () => goto(AppRoute.EXPLORE);

  const handleSelectAllAssets = () => selectAllAssets(timelineManager, assetInteraction);

  const handleMoveLeft = () => setFocusTo('later', 'asset');

  const handleMoveRight = () => setFocusTo('earlier', 'asset');

  const handlePreviousDay = () => setFocusTo('earlier', 'day');

  const handleNextDay = () => setFocusTo('later', 'day');

  const handlePreviousMonth = () => setFocusTo('earlier', 'day');

  const handleNextMonth = () => setFocusTo('later', 'day');

  const handlePreviousYear = () => setFocusTo('earlier', 'year');

  const handleNextYear = () => setFocusTo('later', 'year');

  const handleNavigateToTime = async () => {
    const asset = await modalManager.show(NavigateToDateModal, { timelineManager });
    if (asset) {
      setFocusAsset(asset);
    }
  };

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

  const handleDelete = () => {
    const hasTrashedAsset = assetInteraction.selectedAssets.some((asset) => asset.isTrashed);

    if ($showDeleteModal && (!isTrashEnabled || hasTrashedAsset)) {
      isShowDeleteConfirmation = true;
      return;
    }
    handlePromiseError(trashOrDelete(hasTrashedAsset));
  };

  const handleForceDelete = () => {
    if ($showDeleteModal) {
      isShowDeleteConfirmation = true;
      return;
    }
    handlePromiseError(trashOrDelete(true));
  };

  const handleStackAssets = async () => {
    const result = await stackAssets(assetInteraction.selectedAssets);

    updateStackedAssetInTimeline(timelineManager, result);

    handleEscape?.();
  };

  const handleToggleArchive = async () => {
    const visibility = assetInteraction.isAllArchived ? AssetVisibility.Timeline : AssetVisibility.Archive;
    const ids = await archiveAssets(assetInteraction.selectedAssets, visibility);
    timelineManager.updateAssetOperation(ids, (asset) => {
      asset.visibility = visibility;
      return { remove: false };
    });
    deselectAllAssets();
  };
</script>

<svelte:document
  onkeydown={onKeyDown}
  onkeyup={onKeyUp}
  onselectstart={onSelectStart}
  {@attach shortcut('/', $t('explore'), handleExploreNavigation)}
  {@attach shortcut(
    ctrlKey('a'),
    category(Category.Selection, $t('select_all'), ShortcutVariant.SelectAll),
    handleSelectAllAssets,
  )}
  {@attach conditionalShortcut(
    () => !!handleEscape,
    () =>
      shortcut('Escape', category(Category.Selection, $t('deselect_all'), ShortcutVariant.DeselectAll), handleEscape!),
  )}
  {@attach registerShortcutVariant(ShortcutVariant.SelectAll, ShortcutVariant.DeselectAll)}
  {@attach shortcut(
    'ArrowLeft',
    category(Category.Navigation, $t('move_left'), ShortcutVariant.NextAsset),
    handleMoveLeft,
  )}
  {@attach shortcut(
    'ArrowRight',
    category(Category.Navigation, $t('move_right'), ShortcutVariant.PreviousAsset),
    handleMoveRight,
  )}
  {@attach registerShortcutVariant(ShortcutVariant.NextAsset, ShortcutVariant.PreviousAsset)}
  {@attach shortcut(
    'd',
    category(Category.Navigation, $t('previous_day'), ShortcutVariant.PreviousDay),
    handlePreviousDay,
  )}
  {@attach shortcut(
    shiftKey('d'),
    category(Category.Navigation, $t('next_day'), ShortcutVariant.NextDay),
    handleNextDay,
  )}
  {@attach registerShortcutVariant(ShortcutVariant.PreviousDay, ShortcutVariant.NextDay)}
  {@attach shortcut(
    'm',
    category(Category.Navigation, $t('previous_month'), ShortcutVariant.PreviousMonth),
    handlePreviousMonth,
  )}
  {@attach shortcut(
    shiftKey('m'),
    category(Category.Navigation, $t('next_month'), ShortcutVariant.NextMonth),
    handleNextMonth,
  )}
  {@attach registerShortcutVariant(ShortcutVariant.PreviousMonth, ShortcutVariant.NextMonth)}
  {@attach shortcut(
    'y',
    category(Category.Navigation, $t('previous_year'), ShortcutVariant.PreviousYear),
    handlePreviousYear,
  )}
  {@attach shortcut(
    shiftKey('y'),
    category(Category.Navigation, $t('next_year'), ShortcutVariant.NextYear),
    handleNextYear,
  )}
  {@attach registerShortcutVariant(ShortcutVariant.PreviousYear, ShortcutVariant.NextYear)}
  {@attach shortcut('g', category(Category.Navigation, $t('go_to_date')), handleNavigateToTime)}
  {@attach shortcut(
    'Delete',
    category(Category.Selection, isTrashEnabled ? $t('move_to_trash') : $t('delete'), ShortcutVariant.Trash),
    handleDelete,
  )}
  {@attach shortcut(
    shiftKey('Delete'),
    category(Category.Selection, isTrashEnabled ? $t('delete_skip_trash') : $t('delete'), ShortcutVariant.Delete),
    handleForceDelete,
  )}
  {@attach registerShortcutVariant(ShortcutVariant.Trash, ShortcutVariant.Delete)}
  {@attach shortcut('s', category(Category.Selection, $t('stack')), handleStackAssets)}
  {@attach shortcut(shiftKey('a'), category(Category.Selection, $t('archive')), handleToggleArchive)}
/>

{#if isShowDeleteConfirmation}
  <DeleteAssetDialog
    size={idsSelectedAssets.length}
    onCancel={() => (isShowDeleteConfirmation = false)}
    onConfirm={() => handlePromiseError(trashOrDelete(true))}
  />
{/if}
