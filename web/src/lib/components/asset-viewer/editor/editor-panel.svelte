<script lang="ts">
  import { user } from '$lib/stores/user.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { type AssetResponseDto } from '@immich/sdk';
  import { mdiClose, mdiCropRotate, mdiTune } from '@mdi/js';
  import { createEventDispatcher, onMount } from 'svelte';
  import CircleIconButton from '../../elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';
  import CropComponent from './CropComponent.svelte';
  import TuneComponent from './TuneComponent.svelte';

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
      name: 'tune',
      icon: mdiTune,
      component: TuneComponent,
    },
    {
      name: 'crop',
      icon: mdiCropRotate,
      component: CropComponent,
    },
  ];

  let selectedType: string = 'tune';
  $: selectedTypeObj = editTypes.find((t) => t.name === selectedType) || editTypes[0];

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
