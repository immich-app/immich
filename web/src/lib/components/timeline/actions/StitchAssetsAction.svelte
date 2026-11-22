<script lang="ts">
  import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
  import StitchModal from '#lib/modals/StitchModal.svelte';
  import { deleteAssets, type OnDelete, type OnUndoDelete } from '#lib/utils/actions.ts';
  import { fileUploadHandler } from '#lib/utils/file-uploader.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
  import { modalManager, toastManager } from '@immich/ui';
  import { mdiImageMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import MenuOption from '../../shared-components/context-menu/MenuOption.svelte';

  interface Props {
    onAssetDelete: OnDelete;
    onUndoDelete?: OnUndoDelete | undefined;
    menuItem?: boolean;
  }

  let { onAssetDelete, onUndoDelete = undefined, menuItem = false }: Props = $props();

  let loading = $state(false);

  const handleStitch = async () => {
    const translate = get(t);
    const candidates = assetMultiSelectManager.ownedAssets.filter((asset) => asset.isImage && !asset.isTrashed);
    if (candidates.length < 2) {
      toastManager.warning(translate('stitch_need_two'));
      return;
    }

    const mode = await modalManager.show(StitchModal, { count: candidates.length });
    if (!mode) {
      return;
    }

    loading = true;
    try {
      const response = await fetch('/api/stitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds: candidates.map((asset) => asset.id), mode }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const blob = await response.blob();
      const day = new Date().toISOString().slice(0, 10);
      const file = new File([blob], `stitched-${day}.jpg`, { type: 'image/jpeg' });
      await fileUploadHandler({ files: [file] });

      toastManager.primary(
        {
          description: translate('stitch_done', { values: { count: candidates.length } }),
          button: (close) => ({
            label: translate('stitch_delete_originals', { values: { count: candidates.length } }),
            onclick: () => {
              close();
              void deleteAssets(false, onAssetDelete, candidates, onUndoDelete);
              assetMultiSelectManager.clear();
            },
          }),
        },
        { timeout: 15000 },
      );
      assetMultiSelectManager.clear();
    } catch (error) {
      handleError(error, translate('errors.unable_to_stitch'));
    } finally {
      loading = false;
    }
  };
</script>

{#if menuItem}
  <MenuOption text={loading ? `${$t('stitch')}…` : $t('stitch')} icon={mdiImageMultipleOutline} onClick={() => void handleStitch()} />
{/if}
