<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import ConfirmModal from '$lib/modals/ConfirmModal.svelte';
  import { editTypes, showCancelConfirmDialog } from '$lib/stores/asset-editor.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { type AssetResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiClose } from '@mdi/js';
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

  function selectType(name: string) {
    selectedType = name;
    onUpdateSelectedType(selectedType);
  }

  const onConfirm = () => (typeof $showCancelConfirmDialog === 'boolean' ? null : $showCancelConfirmDialog());
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onClose }} />

<section class="relative p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
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
  <section class="px-4 py-4">
    <ul class="flex w-full justify-around">
      {#each editTypes as etype (etype.name)}
        <li>
          <IconButton
            shape="round"
            color={etype.name === selectedType ? 'primary' : 'secondary'}
            icon={etype.icon}
            aria-label={etype.name}
            onclick={() => selectType(etype.name)}
          />
        </li>
      {/each}
    </ul>
  </section>
  <section>
    <selectedTypeObj.component />
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
