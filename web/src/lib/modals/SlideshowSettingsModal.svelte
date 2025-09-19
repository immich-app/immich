<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import type { RenderedOption } from '$lib/elements/Dropdown.svelte';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import {
    mdiArrowDownThin,
    mdiArrowUpThin,
    mdiFitToPageOutline,
    mdiFitToScreenOutline,
    mdiPanorama,
    mdiShuffle,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import SettingDropdown from '../components/shared-components/settings/setting-dropdown.svelte';
  import { SlideshowLook, SlideshowNavigation, slideshowStore } from '../stores/slideshow.store';

  const {
    slideshowDelay,
    showProgressBar,
    slideshowNavigation,
    slideshowLook,
    slideshowTransition,
    slideshowAutoplay,
  } = slideshowStore;

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  // Temporary variables to hold the settings - marked as reactive with $state() but initialized with store values
  let tempSlideshowDelay = $state($slideshowDelay);
  let tempShowProgressBar = $state($showProgressBar);
  let tempSlideshowNavigation = $state($slideshowNavigation);
  let tempSlideshowLook = $state($slideshowLook);
  let tempSlideshowTransition = $state($slideshowTransition);
  let tempSlideshowAutoplay = $state($slideshowAutoplay);

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

  const applyChanges = () => {
    $slideshowDelay = tempSlideshowDelay;
    $showProgressBar = tempShowProgressBar;
    $slideshowNavigation = tempSlideshowNavigation;
    $slideshowLook = tempSlideshowLook;
    $slideshowTransition = tempSlideshowTransition;
    $slideshowAutoplay = tempSlideshowAutoplay;
    onClose();
  };
</script>

<Modal size="small" title={$t('slideshow_settings')} onClose={() => onClose()}>
  <ModalBody>
    <div class="flex flex-col gap-4 text-primary">
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
      <SettingSwitch title={$t('autoplay_slideshow')} bind:checked={tempSlideshowAutoplay} />
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
  </ModalBody>
  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" shape="round" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button fullWidth color="primary" shape="round" onclick={applyChanges}>{$t('confirm')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
