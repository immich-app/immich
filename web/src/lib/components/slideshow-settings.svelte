<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { mdiArrowDownThin, mdiArrowUpThin, mdiShuffle } from '@mdi/js';
  import { SlideshowNavigation, slideshowStore } from '../stores/slideshow.store';
  import Button from './elements/buttons/button.svelte';
  import type { RenderedOption } from './elements/dropdown.svelte';
  import SettingDropdown from './shared-components/settings/setting-dropdown.svelte';

  const { slideshowDelay, showProgressBar, slideshowNavigation } = slideshowStore;

  export let onClose = () => {};

  const options: Record<SlideshowNavigation, RenderedOption> = {
    [SlideshowNavigation.Shuffle]: { icon: mdiShuffle, title: 'Shuffle' },
    [SlideshowNavigation.AscendingOrder]: { icon: mdiArrowUpThin, title: 'Backward' },
    [SlideshowNavigation.DescendingOrder]: { icon: mdiArrowDownThin, title: 'Forward' },
  };

  export const handleToggle = (selectedOption: RenderedOption) => {
    for (const [key, option] of Object.entries(options)) {
      if (option === selectedOption) {
        $slideshowNavigation = key as SlideshowNavigation;
        break;
      }
    }
  };
</script>

<FullScreenModal on:clickOutside={onClose} on:escape={onClose}>
  <div
    class="flex w-full md:w-96 max-w-lg flex-col gap-8 rounded-3xl border bg-white p-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray"
  >
    <h1 class="self-center text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">
      Slideshow Settings
    </h1>

    <div class="flex flex-col gap-4 text-immich-primary dark:text-immich-dark-primary">
      <SettingDropdown
        title="Direction"
        options={Object.values(options)}
        selectedOption={options[$slideshowNavigation]}
        onToggle={(option) => handleToggle(option)}
      />
      <SettingSwitch title="Show Progress Bar" bind:checked={$showProgressBar} />
      <SettingInputField
        inputType={SettingInputFieldType.NUMBER}
        label="Duration"
        desc="Number of seconds to display each image"
        min={1}
        bind:value={$slideshowDelay}
      />

      <Button class="w-full" color="gray" on:click={onClose}>Done</Button>
    </div>
  </div>
</FullScreenModal>
