<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import {
    mdiArrowDownThin,
    mdiArrowUpThin,
    mdiFitToPageOutline,
    mdiFitToScreenOutline,
    mdiPanorama,
    mdiShuffle,
  } from '@mdi/js';

  import { SettingInputFieldType } from '$lib/constants';
  import { t } from 'svelte-i18n';
  import { SlideshowLook, SlideshowNavigation, slideshowStore } from '../stores/slideshow.store';
  import Button from './elements/buttons/button.svelte';
  import type { RenderedOption } from './elements/dropdown.svelte';
  import SettingDropdown from './shared-components/settings/setting-dropdown.svelte';

  const { slideshowDelay, showProgressBar, slideshowNavigation, slideshowLook, slideshowTransition } = slideshowStore;

  interface Props {
    onClose?: () => void;
  }

  let { onClose = () => {} }: Props = $props();

  const navigationOptions: Record<SlideshowNavigation, RenderedOption> = {
    [SlideshowNavigation.Shuffle]: { icon: mdiShuffle, title: $t('shuffle') },
    [SlideshowNavigation.AscendingOrder]: { icon: mdiArrowUpThin, title: $t('backward') },
    [SlideshowNavigation.DescendingOrder]: { icon: mdiArrowDownThin, title: $t('forward') },
  };

  const lookOptions: Record<SlideshowLook, RenderedOption> = {
    [SlideshowLook.Contain]: { icon: mdiFitToScreenOutline, title: $t('contain') },
    [SlideshowLook.Cover]: { icon: mdiFitToPageOutline, title: $t('cover') },
    [SlideshowLook.BlurredBackground]: { icon: mdiPanorama, title: $t('blurred_background') },
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

  let tempSlideshowDelay = $slideshowDelay;
  let tempShowProgressBar = $showProgressBar;
  let tempSlideshowNavigation = $slideshowNavigation;
  let tempSlideshowLook = $slideshowLook;
  let tempSlideshowTransition = $slideshowTransition;

  const applyChanges = () => {
    $slideshowDelay = tempSlideshowDelay;
    $showProgressBar = tempShowProgressBar;
    $slideshowNavigation = tempSlideshowNavigation;
    $slideshowLook = tempSlideshowLook;
    $slideshowTransition = tempSlideshowTransition;
    onClose();
  };
</script>

<FullScreenModal title={$t('slideshow_settings')} onClose={() => onClose()}>
  <div class="flex flex-col gap-4 text-immich-primary dark:text-immich-dark-primary">
    <SettingDropdown
      title={$t('direction')}
      options={Object.values(navigationOptions)}
      selectedOption={navigationOptions[tempSlideshowNavigation]}
      onToggle={(option) => {
        tempSlideshowNavigation = handleToggle(option, navigationOptions) || tempSlideshowNavigation;
      }}
    />
    <SettingDropdown
      title={$t('look')}
      options={Object.values(lookOptions)}
      selectedOption={lookOptions[tempSlideshowLook]}
      onToggle={(option) => {
        tempSlideshowLook = handleToggle(option, lookOptions) || tempSlideshowLook;
      }}
    />
    <SettingSwitch title={$t('show_progress_bar')} bind:checked={tempShowProgressBar} />
    <SettingSwitch title={$t('show_slideshow_transition')} bind:checked={tempSlideshowTransition} />
    <SettingInputField
      inputType={SettingInputFieldType.NUMBER}
      label={$t('duration')}
      description={$t('admin.slideshow_duration_description')}
      min={1}
      bind:value={tempSlideshowDelay}
    />
  </div>

  {#snippet stickyBottom()}
    <Button fullwidth color="primary" onclick={(_) => applyChanges()}>{$t('done')}</Button>
  {/snippet}
</FullScreenModal>
