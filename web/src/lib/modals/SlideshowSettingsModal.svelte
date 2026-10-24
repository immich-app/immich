<script lang="ts">
  import { Field, FormModal, HelperText, NumberInput, Select, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';
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
    slideshowAnimate,
    slideshowAnimateZoomStrength,
    slideshowNavigation,
    slideshowLook,
    slideshowTransition,
    slideshowAutoplay,
    slideshowRepeat,
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
  let tempSlideshowAnimate = $state($slideshowAnimate);
  let tempSlideshowAnimateZoomStrength = $state($slideshowAnimateZoomStrength);
  let tempSlideshowNavigation = $state($slideshowNavigation);
  let tempSlideshowLook = $state($slideshowLook);
  let tempSlideshowTransition = $state($slideshowTransition);
  let tempSlideshowAutoplay = $state($slideshowAutoplay);
  let tempSlideshowRepeat = $state($slideshowRepeat);
  let tempSlideshowShowMetadataOverlay = $state($slideshowShowMetadataOverlay);
  let tempSlideshowMetadataOverlayMode = $state($slideshowMetadataOverlayMode);

  const navigationOptions = [
    { value: SlideshowNavigation.Shuffle, label: $t('shuffle') },
    { value: SlideshowNavigation.AscendingOrder, label: $t('backward') },
    { value: SlideshowNavigation.DescendingOrder, label: $t('forward') },
  ];

  const lookOptions = [
    { value: SlideshowLook.Contain, label: $t('contain') },
    { value: SlideshowLook.Cover, label: $t('cover') },
    { value: SlideshowLook.BlurredBackground, label: $t('blurred_background') },
  ];

  const metadataOverlayModeOptions = [
    {
      value: SlideshowMetadataOverlayMode.DescriptionOnly,
      label: $t('slideshow_metadata_overlay_mode_description_only'),
    },
    {
      value: SlideshowMetadataOverlayMode.Full,
      label: $t('slideshow_metadata_overlay_mode_full'),
    },
  ];

  const onSubmit = () => {
    $slideshowDelay = tempSlideshowDelay;
    $showProgressBar = tempShowProgressBar;
    $slideshowAnimate = tempSlideshowAnimate;
    $slideshowAnimateZoomStrength = tempSlideshowAnimateZoomStrength;
    $slideshowNavigation = tempSlideshowNavigation;
    $slideshowLook = tempSlideshowLook;
    $slideshowTransition = tempSlideshowTransition;
    $slideshowAutoplay = tempSlideshowAutoplay;
    $slideshowRepeat = tempSlideshowRepeat;
    $slideshowState = SlideshowState.PlaySlideshow;
    $slideshowShowMetadataOverlay = tempSlideshowShowMetadataOverlay;
    $slideshowMetadataOverlayMode = tempSlideshowMetadataOverlayMode;
    onClose();
  };
</script>

<FormModal size="small" title={$t('slideshow_settings')} {onClose} {onSubmit}>
  <div class="flex flex-col gap-4">
    <Field label={$t('direction')}>
      <Select bind:value={tempSlideshowNavigation} options={navigationOptions} />
    </Field>

    <Field label={$t('look')}>
      <Select bind:value={tempSlideshowLook} options={lookOptions} />
    </Field>

    <Field label={$t('autoplay_slideshow')}>
      <Switch bind:checked={tempSlideshowAutoplay} />
    </Field>

    <Field label={$t('show_progress_bar')}>
      <Switch bind:checked={tempShowProgressBar} />
    </Field>

    <Field label={$t('show_slideshow_transition')}>
      <Switch bind:checked={tempSlideshowTransition} />
    </Field>

    <Field label={$t('slideshow_repeat')} description={$t('slideshow_repeat_description')}>
      <Switch bind:checked={tempSlideshowRepeat} />
    </Field>

    <Field label={$t('show_slideshow_metadata_overlay')}>
      <Switch bind:checked={tempSlideshowShowMetadataOverlay} />
    </Field>

    <Field label={$t('slideshow_metadata_overlay_mode')} disabled={!tempSlideshowShowMetadataOverlay}>
      <Select bind:value={tempSlideshowMetadataOverlayMode} options={metadataOverlayModeOptions} />
    </Field>

    <Field label={$t('duration')}>
      <NumberInput min={1} bind:value={tempSlideshowDelay} />
      <HelperText>{$t('admin.slideshow_duration_description')}</HelperText>
    </Field>

    <Field label={$t('slideshow_animate')}>
      <Switch bind:checked={tempSlideshowAnimate} />
    </Field>
    <Field label={$t('slideshow_animate_zoom_strength')}>
      <NumberInput bind:value={tempSlideshowAnimateZoomStrength} min={1} max={100} disabled={!tempSlideshowAnimate} />
    </Field>
  </div>
</FormModal>
