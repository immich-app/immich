<script lang="ts">
  import { goto } from '$app/navigation';
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import {
    setFocusToAsset as setFocusAssetInit,
    setFocusTo as setFocusToInit,
  } from '$lib/components/timeline/actions/focus-actions';
  import { AppRoute } from '$lib/constants';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import AssetDeleteConfirmModal from '$lib/modals/AssetDeleteConfirmModal.svelte';
  import NavigateToDateModal from '$lib/modals/NavigateToDateModal.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { searchStore } from '$lib/stores/search.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets, updateStackedAssetInTimeline } from '$lib/utils/actions';
  import { archiveAssets, cancelMultiselect, selectAllAssets, stackAssets } from '$lib/utils/asset-utils';
  import { AssetVisibility } from '@immich/sdk';
  import { modalManager } from '@immich/ui';

  type Props = {
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    onEscape?: () => void;
    scrollToAsset: (asset: TimelineAsset) => boolean;
  };

  let { timelineManager = $bindable(), assetInteraction, onEscape, scrollToAsset }: Props = $props();

  const { isViewing: showAssetViewer } = assetViewingStore;

  const trashOrDelete = async (forceRequested?: boolean) => {
    const force = forceRequested || !featureFlagsManager.value.trash;
    const selectedAssets = assetInteraction.selectedAssets;

    if ($showDeleteModal && force) {
      const confirmed = await modalManager.show(AssetDeleteConfirmModal, { size: selectedAssets.length });
      if (!confirmed) {
        return;
      }
    }

    await deleteAssets(
      force,
      (assetIds) => {
        timelineManager.removeAssets(assetIds);
        eventManager.emit('AssetsDelete', assetIds);
      },
      selectedAssets,
      force ? undefined : (assets) => timelineManager.upsertAssets(assets),
    );
    assetInteraction.clearMultiselect();
  };

  const onDelete = () => {
    const hasTrashedAsset = assetInteraction.selectedAssets.some((asset) => asset.isTrashed);
    handlePromiseError(trashOrDelete(hasTrashedAsset));
  };

  const onStackAssets = async () => {
    const result = await stackAssets(assetInteraction.selectedAssets);

    updateStackedAssetInTimeline(timelineManager, result);

    onEscape?.();
  };

  const toggleArchive = async () => {
    const visibility = assetInteraction.isAllArchived ? AssetVisibility.Timeline : AssetVisibility.Archive;
    const ids = await archiveAssets(assetInteraction.selectedAssets, visibility);
    timelineManager.update(ids, (asset) => (asset.visibility = visibility));
    eventManager.emit('AssetsArchive', ids);
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

  const isEmpty = $derived(timelineManager.isInitialized && timelineManager.months.length === 0);
  let isShortcutModalOpen = false;

  const handleOpenShortcutModal = async () => {
    if (isShortcutModalOpen) {
      return;
    }

    isShortcutModalOpen = true;
    await modalManager.show(ShortcutsModal, {});
    isShortcutModalOpen = false;
  };

  $effect(() => {
    if (isEmpty) {
      assetInteraction.clearMultiselect();
    }
  });

  const setFocusTo = setFocusToInit.bind(undefined, scrollToAsset, timelineManager);
  const setFocusAsset = setFocusAssetInit.bind(undefined, scrollToAsset);

  const handleOpenDateModal = async () => {
    const asset = await modalManager.show(NavigateToDateModal, { timelineManager });
    if (asset) {
      setFocusAsset(asset);
    }
  };

  let shortcutList = $derived(
    (() => {
      if (searchStore.isSearchEnabled || $showAssetViewer) {
        return [];
      }

      const shortcuts: ShortcutOptions[] = [
        { shortcut: { key: '?', shift: true }, onShortcut: handleOpenShortcutModal },
        { shortcut: { key: '/' }, onShortcut: () => goto(AppRoute.EXPLORE) },
        { shortcut: { key: 'A', ctrl: true }, onShortcut: () => selectAllAssets(timelineManager, assetInteraction) },
        { shortcut: { key: 'ArrowRight' }, onShortcut: () => setFocusTo('earlier', 'asset') },
        { shortcut: { key: 'ArrowLeft' }, onShortcut: () => setFocusTo('later', 'asset') },
        { shortcut: { key: 'D' }, onShortcut: () => setFocusTo('earlier', 'day') },
        { shortcut: { key: 'D', shift: true }, onShortcut: () => setFocusTo('later', 'day') },
        { shortcut: { key: 'M' }, onShortcut: () => setFocusTo('earlier', 'month') },
        { shortcut: { key: 'M', shift: true }, onShortcut: () => setFocusTo('later', 'month') },
        { shortcut: { key: 'Y' }, onShortcut: () => setFocusTo('earlier', 'year') },
        { shortcut: { key: 'Y', shift: true }, onShortcut: () => setFocusTo('later', 'year') },
        { shortcut: { key: 'G' }, onShortcut: handleOpenDateModal },
      ];
      if (onEscape) {
        shortcuts.push({ shortcut: { key: 'Escape' }, onShortcut: onEscape });
      }

      if (assetInteraction.selectionActive) {
        shortcuts.push(
          { shortcut: { key: 'Delete' }, onShortcut: onDelete },
          { shortcut: { key: 'Delete', shift: true }, onShortcut: () => trashOrDelete(true) },
          { shortcut: { key: 'D', ctrl: true }, onShortcut: () => deselectAllAssets() },
          { shortcut: { key: 's' }, onShortcut: () => onStackAssets() },
          { shortcut: { key: 'a', shift: true }, onShortcut: toggleArchive },
        );
      }

      return shortcuts;
    })(),
  );
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} onselectstart={onSelectStart} use:shortcuts={shortcutList} />
