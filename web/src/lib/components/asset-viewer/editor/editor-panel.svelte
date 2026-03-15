<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { editManager, EditToolType, type EditTool } from '$lib/managers/edit/edit-manager.svelte';
  import { websocketEvents } from '$lib/stores/websocket';
  import { getAssetEdits, type AssetResponseDto } from '@immich/sdk';
  import { Button, HStack, IconButton } from '@immich/ui';
  import { mdiClose } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let currentEdits = $state<Parameters<typeof editManager.activateTool>[2] | null>(null);

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
    currentEdits = edits;
    await editManager.activateTool(EditToolType.Transform, asset, edits);
  });

  async function switchTool(tool: EditTool) {
    if (currentEdits) {
      await editManager.activateTool(tool.type, asset, currentEdits);
    }
  }

  onDestroy(() => {
    editManager.cleanup();
  });

  async function applyEdits() {
    const success = await editManager.applyEdits();

    if (success) {
      onClose();
    }
  }

  async function closeEditor() {
    if (await editManager.closeConfirm()) {
      onClose();
    }
  }

  let { asset = $bindable(), onClose }: Props = $props();
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onClose }} />

<section class="relative flex flex-col h-full p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg dark pt-3">
  <HStack class="justify-between me-4">
    <HStack>
      <IconButton
        shape="round"
        variant="ghost"
        color="secondary"
        icon={mdiClose}
        aria-label={$t('close')}
        onclick={closeEditor}
      />
      <p class="text-lg text-immich-fg dark:text-immich-dark-fg capitalize">{$t('editor')}</p>
    </HStack>
    <Button shape="round" size="small" onclick={applyEdits} loading={editManager.isApplyingEdits}>{$t('save')}</Button>
  </HStack>

  <section class="px-2 mt-2">
    <HStack gap={1}>
      {#each editManager.tools as tool (tool.type)}
        <IconButton
          shape="round"
          size="small"
          variant={editManager.selectedTool?.type === tool.type ? 'filled' : 'ghost'}
          color={editManager.selectedTool?.type === tool.type ? 'primary' : 'secondary'}
          icon={tool.icon}
          aria-label={tool.type}
          onclick={() => switchTool(tool)}
        />
      {/each}
    </HStack>
  </section>

  <section>
    {#if editManager.selectedTool}
      <editManager.selectedTool.component />
    {/if}
  </section>
  <div class="flex-1"></div>
  <section class="p-4">
    <Button
      variant="outline"
      onclick={() => editManager.resetAllChanges()}
      disabled={!editManager.canReset}
      class="self-start"
      shape="round"
      size="small"
    >
      {$t('editor_reset_all_changes')}
    </Button>
  </section>
</section>
