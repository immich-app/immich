<script lang="ts">
  import { websocketEvents } from '$lib/stores/websocket';
  import { type AssetResponseDto } from '@immich/sdk';
  import { mdiClose } from '@mdi/js';
  import { onMount } from 'svelte';
  import CircleIconButton from '../../elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';
  import { editTypes, showCancelConfirmDialog } from '$lib/stores/asset-editor.store';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import { shortcut } from '$lib/actions/shortcut';

  export let asset: AssetResponseDto;

  onMount(() => {
    return websocketEvents.on('on_asset_update', (assetUpdate) => {
      if (assetUpdate.id === asset.id) {
        asset = assetUpdate;
      }
    });
  });

  export let onUpdateSelectedType: (type: string) => void;
  export let onClose: () => void;

  let selectedType: string = editTypes[0].name;
  // svelte-ignore reactive_declaration_non_reactive_property
  $: selectedTypeObj = editTypes.find((t) => t.name === selectedType) || editTypes[0];

  setTimeout(() => {
    onUpdateSelectedType(selectedType);
  }, 1);
  function selectType(name: string) {
    selectedType = name;
    onUpdateSelectedType(selectedType);
  }
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onClose }} />

<section class="relative p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
  <div class="flex place-items-center gap-2">
    <CircleIconButton icon={mdiClose} title={$t('close')} on:click={onClose} />
    <p class="text-lg text-immich-fg dark:text-immich-dark-fg capitalize">{$t('editor')}</p>
  </div>
  <section class="px-4 py-4">
    <ul class="flex w-full justify-around">
      {#each editTypes as etype (etype.name)}
        <li>
          <CircleIconButton
            color={etype.name === selectedType ? 'primary' : 'opaque'}
            icon={etype.icon}
            title={etype.name}
            on:click={() => selectType(etype.name)}
          />
        </li>
      {/each}
    </ul>
  </section>
  <section>
    <svelte:component this={selectedTypeObj.component} />
  </section>
</section>

{#if $showCancelConfirmDialog}
  <ConfirmDialog
    title={$t('editor_close_without_save_title')}
    prompt={$t('editor_close_without_save_prompt')}
    cancelText={$t('no')}
    cancelColor="secondary"
    confirmColor="red"
    confirmText={$t('close')}
    onCancel={() => {
      $showCancelConfirmDialog = false;
    }}
    onConfirm={() => (typeof $showCancelConfirmDialog === 'boolean' ? null : $showCancelConfirmDialog())}
  />
{/if}
