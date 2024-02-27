<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { slideshowStore } from '../stores/slideshow.store';
  import Button from './elements/buttons/button.svelte';

  const { slideshowShuffle, slideshowDelay, showProgressBar } = slideshowStore;

  export let onClose = () => {};
</script>

<FullScreenModal on:clickOutside={onClose} on:escape={onClose}>
  <div
    class="flex w-96 max-w-lg flex-col gap-8 rounded-3xl border bg-white p-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray"
  >
    <h1 class="self-center text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">
      Slideshow Settings
    </h1>

    <div class="flex flex-col gap-4 text-immich-primary dark:text-immich-dark-primary">
      <SettingSwitch title="Shuffle" bind:checked={$slideshowShuffle} />
      <SettingSwitch title="Show Progress Bar" bind:checked={$showProgressBar} />
      <SettingInputField
        inputType={SettingInputFieldType.NUMBER}
        label="Delay"
        desc="Number of seconds to display each image"
        min={1}
        bind:value={$slideshowDelay}
      />

      <Button class="w-full" color="gray" on:click={onClose}>Done</Button>
    </div>
  </div>
</FullScreenModal>
