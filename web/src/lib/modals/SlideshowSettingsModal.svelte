<script lang="ts">
  import type { RenderedOption } from '$lib/elements/Dropdown.svelte';
  import { Field, FormModal, HelperText, NumberInput, Switch } from '@immich/ui';
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
  import {
    SlideshowLook,
    SlideshowMetadataOverlayMode,
    SlideshowNavigation,
    SlideshowState,
    slideshowStore,
  } from '../stores/slideshow.store';

  const {
    slideshowDelay,
    showProgressBar,
    slideshowNavigation,
    slideshowLook,
    slideshowTransition,
    slideshowAutoplay,
    slideshowState,
    slideshowShowMetadataOverlay,
    slideshowMetadataOverlayMode,
  } = slideshowStore;

  type Props = {
    onClose: () => void;
  };

  let { onClose }: Props = $props();

  // Temporary variables to hold the settings - marked as reactive with $state() but initialized with store values
  let tempSlideshowDelay = $state($slideshowDelay);
  let tempShowProgressBar = $state($showProgressBar);
  let tempSlideshowNavigation = $state($slideshowNavigation);
  let tempSlideshowLook = $state($slideshowLook);
  let tempSlideshowTransition = $state($slideshowTransition);
  let tempSlideshowAutoplay = $state($slideshowAutoplay);
  let tempSlideshowShowMetadataOverlay = $state($slideshowShowMetadataOverlay);
  let tempSlideshowMetadataOverlayMode = $state($slideshowMetadataOverlayMode);

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

  const metadataOverlayModeOptions: Record<SlideshowMetadataOverlayMode, RenderedOption> = {
    [SlideshowMetadataOverlayMode.DescriptionOnly]: {
      title: $t('slideshow_metadata_overlay_mode_description_only'),
    },
    [SlideshowMetadataOverlayMode.Full]: {
      title: $t('slideshow_metadata_overlay_mode_full'),
    },
  };

  const handleToggle = <Type extends SlideshowNavigation | SlideshowLook | SlideshowMetadataOverlayMode>(
    record: RenderedOption,
    options: Record<Type, RenderedOption>,
  ): undefined | Type => {
    for (const [key, option] of Object.entries(options)) {
      if (option === record) {
        return key as Type;
      }
    }
  };

  const onSubmit = () => {
    $slideshowDelay = tempSlideshowDelay;
    $showProgressBar = tempShowProgressBar;
    $slideshowNavigation = tempSlideshowNavigation;
    $slideshowLook = tempSlideshowLook;
    $slideshowTransition = tempSlideshowTransition;
    $slideshowAutoplay = tempSlideshowAutoplay;
    $slideshowState = SlideshowState.PlaySlideshow;
    $slideshowShowMetadataOverlay = tempSlideshowShowMetadataOverlay;
    $slideshowMetadataOverlayMode = tempSlideshowMetadataOverlayMode;
    onClose();
  };
</script>

<FormModal size="small" title={$t('slideshow_settings')} {onClose} {onSubmit}>
  <div class="flex flex-col gap-4">
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

    <Field label={$t('autoplay_slideshow')}>
      <Switch bind:checked={tempSlideshowAutoplay} />
    </Field>

    <Field label={$t('show_progress_bar')}>
      <Switch bind:checked={tempShowProgressBar} />
    </Field>

    <Field label={$t('show_slideshow_transition')}>
      <Switch bind:checked={tempSlideshowTransition} />
    </Field>

    <Field label={$t('show_slideshow_metadata_overlay')}>
      <Switch bind:checked={tempSlideshowShowMetadataOverlay} />
    </Field>

    <div class={tempSlideshowShowMetadataOverlay ? '' : 'opacity-50 pointer-events-none'}>
      <SettingDropdown
        title={$t('slideshow_metadata_overlay_mode')}
        options={Object.values(metadataOverlayModeOptions)}
        selectedOption={metadataOverlayModeOptions[tempSlideshowMetadataOverlayMode]}
        onToggle={(option) => {
          if (tempSlideshowShowMetadataOverlay) {
            tempSlideshowMetadataOverlayMode =
              handleToggle(option, metadataOverlayModeOptions) || tempSlideshowMetadataOverlayMode;
          }
        }}
      />
    </div>

    <Field label={$t('duration')}>
      <NumberInput min={1} bind:value={tempSlideshowDelay} />
      <HelperText>{$t('admin.slideshow_duration_description')}</HelperText>
    </Field>
  </div>
</FormModal>
