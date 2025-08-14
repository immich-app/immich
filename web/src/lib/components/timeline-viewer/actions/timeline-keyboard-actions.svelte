<script lang="ts">
  import { goto } from '$app/navigation';
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import {
    setFocusToAsset as setFocusAssetInit,
    setFocusTo as setFocusToInit,
  } from '$lib/components/photos-page/actions/focus-actions';
  import ChangeDate, {
    type AbsoluteResult,
    type RelativeResult,
  } from '$lib/components/shared-components/change-date.svelte';
  import { AppRoute } from '$lib/constants';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { searchStore } from '$lib/stores/search.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets, updateStackedAssetInTimeline } from '$lib/utils/actions';
  import { archiveAssets, cancelMultiselect, selectAllAssets, stackAssets } from '$lib/utils/asset-utils';
  import { AssetVisibility } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { mdiCalendarBlankOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';
  import DeleteAssetDialog from './delete-asset-dialog.svelte';

  let { isViewing: showAssetViewer } = assetViewingStore;

  interface Props {
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    isShowDeleteConfirmation: boolean;
    onEscape: () => void;
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

    onEscape();
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

  let isTrashEnabled = $derived($featureFlags.loaded && $featureFlags.trash);
  let isEmpty = $derived(timelineManager.isInitialized && timelineManager.months.length === 0);
  let idsSelectedAssets = $derived(assetInteraction.selectedAssets.map(({ id }) => id));
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

  let shortcutList = $derived(
    (() => {
      if (searchStore.isSearchEnabled || $showAssetViewer) {
        return [];
      }

      const shortcuts: ShortcutOptions[] = [
        { shortcut: { key: 'Escape' }, onShortcut: onEscape },
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
        { shortcut: { key: 'G' }, onShortcut: () => (isShowSelectDate = true) },
      ];

      if (assetInteraction.selectionActive) {
        shortcuts.push(
          { shortcut: { key: 'Delete' }, onShortcut: onDelete },
          { shortcut: { key: 'Delete', shift: true }, onShortcut: onForceDelete },
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
    icon={mdiCalendarBlankOutline}
    confirmText={$t('navigate')}
    title={$t('navigate_to_time')}
    initialDate={DateTime.now()}
    timezoneInput={false}
    onConfirm={async (result: AbsoluteResult | RelativeResult) => {
      isShowSelectDate = false;
      if (result.mode === 'absolute') {
        const asset = await timelineManager.getClosestAssetToDate(result.dateTime.toObject());
        if (asset) {
          setFocusAsset(asset);
        }
      }
    }}
    onCancel={() => (isShowSelectDate = false)}
  />
{/if}
