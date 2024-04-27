<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import {
    mdiArrowDownThin,
    mdiArrowUpThin,
    mdiFitToPageOutline,
    mdiFitToScreenOutline,
    mdiPanorama,
    mdiShuffle,
  } from '@mdi/js';
  import { SlideshowLook, SlideshowNavigation, slideshowStore } from '../stores/slideshow.store';
  import Button from './elements/buttons/button.svelte';
  import type { RenderedOption } from './elements/dropdown.svelte';
  import SettingDropdown from './shared-components/settings/setting-dropdown.svelte';

  const { slideshowDelay, showProgressBar, slideshowNavigation, slideshowLook } = slideshowStore;

  export let onClose = () => {};

  const navigationOptions: Record<SlideshowNavigation, RenderedOption> = {
    [SlideshowNavigation.Shuffle]: { icon: mdiShuffle, title: 'Shuffle' },
    [SlideshowNavigation.AscendingOrder]: { icon: mdiArrowUpThin, title: 'Backward' },
    [SlideshowNavigation.DescendingOrder]: { icon: mdiArrowDownThin, title: 'Forward' },
  };

  const lookOptions: Record<SlideshowLook, RenderedOption> = {
    [SlideshowLook.Contain]: { icon: mdiFitToScreenOutline, title: 'Contain' },
    [SlideshowLook.Cover]: { icon: mdiFitToPageOutline, title: 'Cover' },
    [SlideshowLook.BlurredBackground]: { icon: mdiPanorama, title: 'Blurred background' },
  };

  const handleToggle = <Type extends SlideshowNavigation | SlideshowLook>(
    record: RenderedOption,
    options: Record<Type, RenderedOption>,
  ): undefined | Type => {
    for (const [key, option] of Object.entries(options)) {
      if (option === record) {
        return key as Type;
      }
    }
  };
</script>

<FullScreenModal id="slideshow-settings-modal" title="Slideshow settings" {onClose}>
  <div class="flex flex-col gap-4 text-immich-primary dark:text-immich-dark-primary">
    <SettingDropdown
      title="Direction"
      options={Object.values(navigationOptions)}
      selectedOption={navigationOptions[$slideshowNavigation]}
      onToggle={(option) => {
        $slideshowNavigation = handleToggle(option, navigationOptions) || $slideshowNavigation;
      }}
    />
    <SettingDropdown
      title="Look"
      options={Object.values(lookOptions)}
      selectedOption={lookOptions[$slideshowLook]}
      onToggle={(option) => {
        $slideshowLook = handleToggle(option, lookOptions) || $slideshowLook;
      }}
    />
    <SettingSwitch id="show-progress-bar" title="Show Progress Bar" bind:checked={$showProgressBar} />
    <SettingInputField
      inputType={SettingInputFieldType.NUMBER}
      label="Duration"
      desc="Number of seconds to display each image"
      min={1}
      bind:value={$slideshowDelay}
    />
  </div>
  <svelte:fragment slot="sticky-bottom">
    <Button fullwidth color="primary" on:click={onClose}>Done</Button>
  </svelte:fragment>
</FullScreenModal>
