<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { editManager, EditToolType } from '$lib/managers/edit/edit-manager.svelte';
  import { websocketEvents } from '$lib/stores/websocket';
  import { getAssetEdits, type AssetResponseDto } from '@immich/sdk';
  import { Button, IconButton, VStack } from '@immich/ui';
  import { mdiClose, mdiFloppy, mdiRefresh } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  onMount(() => {
    return websocketEvents.on('on_asset_update', (assetUpdate) => {
      if (assetUpdate.id === asset.id) {
        asset = assetUpdate;
      }
    });
  });

  interface Props {
    asset: AssetResponseDto;
    onClose: () => void;
  }

  onMount(async () => {
    const edits = await getAssetEdits({ id: asset.id });
    await editManager.activateTool(EditToolType.Transform, asset, edits);
  });

  onDestroy(() => {
    editManager.cleanup();
  });

  async function applyEdits() {
    const success = await editManager.applyEdits();

    if (success) {
      onClose();
    }
  }

  let { asset = $bindable(), onClose }: Props = $props();
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onClose }} />

<section class="relative flex flex-col h-full p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
  <div class="flex place-items-center gap-2">
    <IconButton
      shape="round"
      variant="ghost"
      color="secondary"
      icon={mdiClose}
      aria-label={$t('close')}
      onclick={onClose}
    />
    <p class="text-lg text-immich-fg dark:text-immich-dark-fg capitalize">{$t('editor')}</p>
  </div>

  <section>
    {#if editManager.selectedTool}
      <editManager.selectedTool.component />
    {/if}
  </section>
  <div class="flex-1"></div>
  <section class="p-4">
    <VStack gap={4}>
      <Button
        fullWidth
        leadingIcon={mdiFloppy}
        color="success"
        onclick={() => applyEdits()}
        loading={editManager.isApplyingEdits}
      >
        {$t('save')}
      </Button>
      <!-- TODO make this clear all edits -->
      <Button fullWidth leadingIcon={mdiRefresh} color="danger">{$t('editor_reset_all_changes')}</Button>
    </VStack>
  </section>
</section>
