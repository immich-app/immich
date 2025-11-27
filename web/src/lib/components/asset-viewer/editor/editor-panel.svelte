<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { editTypes, showCancelConfirmDialog } from '$lib/stores/asset-editor.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { type AssetResponseDto } from '@immich/sdk';
  import { Button, ConfirmModal, IconButton, VStack } from '@immich/ui';
  import { mdiArrowLeft, mdiClose, mdiFloppy } from '@mdi/js';
  import { onMount } from 'svelte';
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
    onUpdateSelectedType: (type: string) => void;
    onClose: () => void;
  }

  let { asset = $bindable(), onUpdateSelectedType, onClose }: Props = $props();

  let selectedType: string = $state(editTypes[0].name);
  let selectedTypeObj = $derived(editTypes.find((t) => t.name === selectedType) || editTypes[0]);

  setTimeout(() => {
    onUpdateSelectedType(selectedType);
  }, 1);

  const onConfirm = () => (typeof $showCancelConfirmDialog === 'boolean' ? null : $showCancelConfirmDialog());
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
    <selectedTypeObj.component />
  </section>
  <div class="flex-1"></div>
  <section class="p-4">
    <VStack gap={4}>
      <Button fullWidth leadingIcon={mdiFloppy} color="success">{$t('save')}</Button>
      <Button fullWidth leadingIcon={mdiArrowLeft} color="secondary">{$t('Revert Changes')}</Button>
    </VStack>
  </section>
</section>

{#if $showCancelConfirmDialog}
  <ConfirmModal
    title={$t('editor_close_without_save_title')}
    prompt={$t('editor_close_without_save_prompt')}
    confirmColor="danger"
    confirmText={$t('close')}
    onClose={(confirmed) => (confirmed ? onConfirm() : ($showCancelConfirmDialog = false))}
  />
{/if}
