<script lang="ts">
  import { goto } from '$app/navigation';
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import DeleteAssetDialog from '$lib/components/photos-page/delete-asset-dialog.svelte';
  import { AppRoute } from '$lib/constants';
  import type { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets } from '$lib/utils/actions';
  import { archiveAssets, cancelMultiselect } from '$lib/utils/asset-utils';
  import { moveFocus } from '$lib/utils/focus-util';
  import { AssetVisibility } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  let { isViewing: isViewerOpen } = assetViewingStore;

  let isTrashEnabled = $derived($featureFlags.loaded && $featureFlags.trash);

  interface Props {
    timelineManager: PhotostreamManager;
    assetInteraction: AssetInteraction;

    isShowDeleteConfirmation?: boolean;

    onReload?: (() => void) | undefined;
  }

  let {
    timelineManager,
    assetInteraction,
    isShowDeleteConfirmation = false,

    onReload,
  }: Props = $props();

  const selectAllAssets = () => {
    const allAssets = timelineManager.months.flatMap((segment) => segment.assets);
    assetInteraction.selectAssets(allAssets);
  };

  const deselectAllAssets = () => {
    cancelMultiselect(assetInteraction);
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

  const trashOrDelete = async (force: boolean = false) => {
    isShowDeleteConfirmation = false;
    await deleteAssets(
      !(isTrashEnabled && !force),
      (assetIds) => timelineManager.removeAssets(assetIds),
      assetInteraction.selectedAssets,
      onReload,
    );
    assetInteraction.clearMultiselect();
  };

  const toggleArchive = async () => {
    const assets = assetInteraction.selectedAssets;
    const visibility = assetInteraction.isAllArchived ? AssetVisibility.Timeline : AssetVisibility.Archive;
    const ids = await archiveAssets(assets, visibility);
    const idSet = new Set(ids);
    if (ids) {
      for (const asset of assets) {
        if (idSet.has(asset.id)) {
          asset.visibility = visibility;
        }
      }
      deselectAllAssets();
    }
  };

  const focusNextAsset = () => moveFocus((element) => element.dataset.thumbnailFocusContainer !== undefined, 'next');
  const focusPreviousAsset = () =>
    moveFocus((element) => element.dataset.thumbnailFocusContainer !== undefined, 'previous');

  let isShortcutModalOpen = false;

  const handleOpenShortcutModal = async () => {
    if (isShortcutModalOpen) {
      return;
    }

    isShortcutModalOpen = true;
    await modalManager.show(ShortcutsModal, { shortcuts: getShortcuts() });
    isShortcutModalOpen = false;
  };

  const getShortcuts = () => {
    const general = Object.values(generalShortcuts);
    const actions = Object.values(actionsShortcuts);
    return {
      general: general
        .filter((general) => 'explainedShortcut' in general)
        .map((generalShortcut) => generalShortcut.explainedShortcut!),
      actions: actions.filter((action) => 'explainedShortcut' in action).map((action) => action.explainedShortcut!),
    };
  };

  const generalShortcuts = {
    OPEN_HELP: {
      shortcut: { key: '?', shift: true },
      onShortcut: handleOpenShortcutModal,
      explainedShortcut: {
        key: ['⇧', '?'],
        action: 'Open this dialog',
      },
    },
    EXPLORE: {
      shortcut: { key: '/' },
      onShortcut: () => goto(AppRoute.EXPLORE),
      explainedShortcut: {
        key: ['/'],
        action: $t('explore'),
      },
    },
    SELECT_ALL: {
      shortcut: { key: 'A', ctrl: true },
      onShortcut: () => selectAllAssets(),
      explainedShortcut: {
        key: ['Ctrl', 'a'],
        action: $t('select_all'),
      },
    },
    ARROW_RIGHT: {
      shortcut: { key: 'ArrowRight' },
      preventDefault: false,
      onShortcut: focusNextAsset,
      explainedShortcut: {
        key: ['←', '→'],
        action: $t('previous_or_next_photo'),
      },
    },
    ARROW_LEFT: {
      shortcut: { key: 'ArrowLeft' },
      preventDefault: false,
      onShortcut: focusPreviousAsset,
    },
  };
  const actionsShortcuts = {
    ESCAPE: {
      shortcut: { key: 'Escape' },
      onShortcut: deselectAllAssets,
      explainedShortcut: {
        key: ['Esc'],
        action: $t('back_close_deselect'),
      },
    },
    DELETE: {
      shortcut: { key: 'Delete' },
      onShortcut: onDelete,
      explainedShortcut: {
        key: ['Del'],
        action: $t('trash_delete_asset'),
        info: $t('shift_to_permanent_delete'),
      },
    },
    FORCE_DELETE: {
      shortcut: { key: 'Delete', shift: true },
      onShortcut: onForceDelete,
    },
    DESELECT_ALL: {
      shortcut: { key: 'D', ctrl: true },
      onShortcut: () => deselectAllAssets(),
      explainedShortcut: {
        key: ['Ctrl', 'd'],
        action: $t('deselect_all'),
      },
    },
    TOGGLE_ARCHIVE: {
      shortcut: { key: 'a', shift: true },
      onShortcut: toggleArchive,
      explainedShortcut: {
        key: ['⇧', 'a'],
        action: $t('select_all'),
      },
    },
  };

  const shortcutList = $derived(
    (() => {
      if ($isViewerOpen) {
        return [];
      }

      const shortcuts: ShortcutOptions[] = [
        generalShortcuts.OPEN_HELP,
        generalShortcuts.EXPLORE,
        generalShortcuts.SELECT_ALL,
        generalShortcuts.ARROW_RIGHT,
        generalShortcuts.ARROW_LEFT,
      ];

      if (assetInteraction.selectionActive) {
        shortcuts.push(
          actionsShortcuts.ESCAPE,
          actionsShortcuts.DELETE,
          actionsShortcuts.FORCE_DELETE,
          actionsShortcuts.DESELECT_ALL,
          actionsShortcuts.TOGGLE_ARCHIVE,
        );
      }

      return shortcuts;
    })(),
  );
</script>

<svelte:document use:shortcuts={shortcutList} />

{#if isShowDeleteConfirmation}
  <DeleteAssetDialog
    size={assetInteraction.selectedAssets.length}
    onCancel={() => (isShowDeleteConfirmation = false)}
    onConfirm={() => handlePromiseError(trashOrDelete(true))}
  />
{/if}
