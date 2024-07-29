<script lang="ts">
  import { websocketEvents } from '$lib/stores/websocket';
  import { type AssetResponseDto } from '@immich/sdk';
  import { mdiClose, mdiCropRotate, mdiTune } from '@mdi/js';
  import { createEventDispatcher, onMount } from 'svelte';
  import CircleIconButton from '../../elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';
  import CropComponent from './crop-tool.svelte';
  import TuneComponent from './tune-tool.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { cropSettingsChanged } from '$lib/stores/asset-editor.store';
  import { derived } from 'svelte/store';

  export let asset: AssetResponseDto;

  onMount(() => {
    return websocketEvents.on('on_asset_update', (assetUpdate) => {
      if (assetUpdate.id === asset.id) {
        asset = assetUpdate;
      }
    });
  });

  const dispatch = createEventDispatcher<{
    updateSelectedType: string;
    close: void;
  }>();

  let editTypes = [
    {
      name: 'crop',
      icon: mdiCropRotate,
      component: CropComponent,
      changesFlag: cropSettingsChanged
    },
  ];

  let selectedType: string = editTypes[0].name;
  $: selectedTypeObj = editTypes.find((t) => t.name === selectedType) || editTypes[0];
  
  const hasChanges = derived(
    editTypes.map(t => t.changesFlag),
    ($changesFlags, set) => {
      set($changesFlags.some(flag => flag));
    }
  );
  
  setTimeout(() => {
    dispatch('updateSelectedType', selectedType);
  }, 1);
  function selectType(name: string) {
    selectedType = name;
    dispatch('updateSelectedType', selectedType);
  }
</script>

<section class="relative p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
  <div class="flex place-items-center gap-2">
    <CircleIconButton icon={mdiClose} title={$t('close')} on:click={() => dispatch('close')} />
    <p class="text-lg text-immich-fg dark:text-immich-dark-fg">{$t('editor')}</p>
  </div>
  <section class="px-4 py-4">
    <ul class="editorul">
      <li>
        <Button disabled={$hasChanges?undefined:true} color={$hasChanges?'primary':"dark-gray"}>{$t('save')}</Button>
      </li>
      {#each editTypes as etype (etype.name)}
        <li>
          <CircleIconButton
            color={etype.name == selectedType ? 'primary' : 'opaque'}
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

<style>
  .editorul {
    display: flex;
    width: 100%;
    justify-content: space-around;
  }
</style>
