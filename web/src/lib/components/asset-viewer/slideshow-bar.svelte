<script lang="ts">
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import ProgressBar from '$lib/components/shared-components/progress-bar/progress-bar.svelte';
  import { ProgressBarStatus } from '$lib/constants';
  import SlideshowSettingsModal from '$lib/modals/SlideshowSettingsModal.svelte';
  import { SlideshowNavigation, slideshowStore } from '$lib/stores/slideshow.store';
  import { AssetTypeEnum } from '@immich/sdk';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiChevronLeft, mdiChevronRight, mdiClose, mdiCog, mdiFullscreen, mdiPause, mdiPlay } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { useSwipe } from 'svelte-gestures';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';

  interface Props {
    isFullScreen: boolean;
    assetType: AssetTypeEnum;
    onNext?: () => void;
    onPrevious?: () => void;
    onClose?: () => void;
    onSetToFullScreen?: () => void;
  }

  let {
    isFullScreen,
    assetType,
    onNext = () => {},
    onPrevious = () => {},
    onClose = () => {},
    onSetToFullScreen = () => {},
  }: Props = $props();

  const { restartProgress, stopProgress, slideshowDelay, showProgressBar, slideshowNavigation, slideshowAutoplay } =
    slideshowStore;

  let progressBarStatus: ProgressBarStatus | undefined = $state();
  let progressBar = $state<ReturnType<typeof ProgressBar>>();
  let showControls = $state(true);
  let timer: NodeJS.Timeout;
  let isOverControls = $state(false);
  const isVideoSlide = $derived(assetType === AssetTypeEnum.Video);

  let unsubscribeRestart: () => void;
  let unsubscribeStop: () => void;

  const setCursorStyle = (style: string) => {
    document.body.style.cursor = style;
  };

  const stopControlsHideTimer = () => {
    clearTimeout(timer);
    setCursorStyle('');
  };

  const showControlBar = () => {
    showControls = true;
    stopControlsHideTimer();
    hideControlsAfterDelay();
  };

  const hideControlsAfterDelay = () => {
    timer = setTimeout(() => {
      if (!isOverControls) {
        showControls = false;
        setCursorStyle('none');
      }
    }, 2500);
  };

  onMount(() => {
    hideControlsAfterDelay();
    unsubscribeRestart = restartProgress.subscribe((value) => {
      if (value) {
        progressBar?.restart();
      }
    });

    unsubscribeStop = stopProgress.subscribe((value) => {
      if (value) {
        progressBar?.restart();
        stopControlsHideTimer();
      }
    });
  });

  onDestroy(() => {
    if (unsubscribeRestart) {
      unsubscribeRestart();
    }

    if (unsubscribeStop) {
      unsubscribeStop();
    }
  });

  const handleDone = async () => {
    await progressBar?.resetProgress();

    if ($slideshowNavigation === SlideshowNavigation.AscendingOrder) {
      onPrevious();
      return;
    }
    onNext();
  };

  const onShowSettings = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    await modalManager.show(SlideshowSettingsModal);
  };

  onMount(() => {
    function exitFullscreenHandler() {
      const doc = document as Document & {
        webkitIsFullScreen?: boolean;
      };

      if (!document.fullscreenElement && !doc.webkitIsFullScreen) {
        onClose();
      }
    }

    document.addEventListener('fullscreenchange', exitFullscreenHandler);
    document.addEventListener('webkitfullscreenchange', exitFullscreenHandler);

    return () => {
      document.removeEventListener('fullscreenchange', exitFullscreenHandler);
      document.removeEventListener('webkitfullscreenchange', exitFullscreenHandler);
    };
  });

  const { swipe, onswipe, onswipedown } = useSwipe(
    () => {},
    () => ({ touchAction: 'pan-x' }),
    { onswipedown: showControlBar },
    true,
  );

  const shortcutBindings = $derived.by((): ShortcutOptions[] => {
    const bindings: ShortcutOptions[] = [
      { shortcut: { key: 'Escape' }, onShortcut: onClose },
      { shortcut: { key: 'ArrowLeft' }, onShortcut: onPrevious },
      { shortcut: { key: 'ArrowRight' }, onShortcut: onNext },
    ];

    // For videos, allow the native HTML5 element to handle space for play/pause
    if (!isVideoSlide) {
      bindings.push({
        shortcut: { key: ' ' },
        onShortcut: () => {
          if (progressBarStatus === ProgressBarStatus.Paused) {
            progressBar?.play();
          } else {
            progressBar?.pause();
          }
        },
        preventDefault: true,
      });
    }

    return bindings;
  });
</script>

<svelte:document onmousemove={showControlBar} use:shortcuts={shortcutBindings} />

{/* @ts-expect-error https://github.com/Rezi/svelte-gestures/issues/38#issuecomment-3315953573 */ null}
<svelte:body {@attach swipe} {onswipe} {onswipedown} />

{#if showControls}
  <div
    class="m-4 flex gap-2 dark"
    onmouseenter={() => (isOverControls = true)}
    onmouseleave={() => (isOverControls = false)}
    transition:fly={{ duration: 150 }}
    role="navigation"
  >
    <IconButton
      variant="ghost"
      shape="round"
      color="secondary"
      icon={mdiClose}
      onclick={onClose}
      aria-label={$t('exit_slideshow')}
    />

    {#if !isVideoSlide}
      <IconButton
        variant="ghost"
        shape="round"
        color="secondary"
        icon={progressBarStatus === ProgressBarStatus.Paused ? mdiPlay : mdiPause}
        onclick={() => (progressBarStatus === ProgressBarStatus.Paused ? progressBar?.play() : progressBar?.pause())}
        aria-label={progressBarStatus === ProgressBarStatus.Paused ? $t('play') : $t('pause')}
      />
    {/if}
    <IconButton
      variant="ghost"
      shape="round"
      color="secondary"
      icon={mdiChevronLeft}
      onclick={onPrevious}
      aria-label={$t('previous')}
    />
    <IconButton
      variant="ghost"
      shape="round"
      color="secondary"
      icon={mdiChevronRight}
      onclick={onNext}
      aria-label={$t('next')}
    />
    <IconButton
      variant="ghost"
      shape="round"
      color="secondary"
      icon={mdiCog}
      onclick={onShowSettings}
      aria-label={$t('slideshow_settings')}
    />
    {#if !isFullScreen}
      <IconButton
        variant="ghost"
        shape="round"
        color="secondary"
        icon={mdiFullscreen}
        onclick={onSetToFullScreen}
        aria-label={$t('set_slideshow_to_fullscreen')}
      />
    {/if}
  </div>
{/if}

{#if !isVideoSlide}
  <ProgressBar
    autoplay={$slideshowAutoplay}
    hidden={!$showProgressBar}
    duration={$slideshowDelay}
    bind:this={progressBar}
    bind:status={progressBarStatus}
    onDone={handleDone}
  />
{/if}
