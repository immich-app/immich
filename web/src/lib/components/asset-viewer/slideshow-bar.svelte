<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ProgressBar from '$lib/components/shared-components/progress-bar/progress-bar.svelte';
  import SlideshowSettings from '$lib/components/slideshow-settings.svelte';
  import { ProgressBarStatus } from '$lib/constants';
  import { SlideshowNavigation, slideshowStore } from '$lib/stores/slideshow.store';
  import { mdiChevronLeft, mdiChevronRight, mdiClose, mdiCog, mdiFullscreen, mdiPause, mdiPlay } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { swipe } from 'svelte-gestures';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';

  interface Props {
    isFullScreen: boolean;
    onNext?: () => void;
    onPrevious?: () => void;
    onClose?: () => void;
    onSetToFullScreen?: () => void;
  }

  let {
    isFullScreen,
    onNext = () => {},
    onPrevious = () => {},
    onClose = () => {},
    onSetToFullScreen = () => {},
  }: Props = $props();

  const { restartProgress, stopProgress, slideshowDelay, showProgressBar, slideshowNavigation } = slideshowStore;

  let progressBarStatus: ProgressBarStatus | undefined = $state();
  let progressBar = $state<ReturnType<typeof ProgressBar>>();
  let showSettings = $state(false);
  let showControls = $state(true);
  let timer: NodeJS.Timeout;
  let isOverControls = $state(false);

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
    }, 10_000);
  };

  onMount(() => {
    hideControlsAfterDelay();
    unsubscribeRestart = restartProgress.subscribe((value) => {
      if (value) {
        progressBar?.restart(value);
      }
    });

    unsubscribeStop = stopProgress.subscribe((value) => {
      if (value) {
        progressBar?.restart(false);
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
    await progressBar?.reset();

    if ($slideshowNavigation === SlideshowNavigation.AscendingOrder) {
      onPrevious();
      return;
    }
    onNext();
  };
</script>

<svelte:window
  onmousemove={showControlBar}
  use:shortcuts={[
    { shortcut: { key: 'Escape' }, onShortcut: onClose },
    { shortcut: { key: 'ArrowLeft' }, onShortcut: onPrevious },
    { shortcut: { key: 'ArrowRight' }, onShortcut: onNext },
  ]}
/>

<svelte:body use:swipe={() => ({ touchAction: 'pan-x' })} onswipedown={showControlBar} />

{#if showControls}
  <div
    class="m-4 flex gap-2"
    onmouseenter={() => (isOverControls = true)}
    onmouseleave={() => (isOverControls = false)}
    transition:fly={{ duration: 150 }}
    role="navigation"
  >
    <CircleIconButton buttonSize="50" icon={mdiClose} onclick={onClose} title={$t('exit_slideshow')} />

    <CircleIconButton
      buttonSize="50"
      icon={progressBarStatus === ProgressBarStatus.Paused ? mdiPlay : mdiPause}
      onclick={() => (progressBarStatus === ProgressBarStatus.Paused ? progressBar?.play() : progressBar?.pause())}
      title={progressBarStatus === ProgressBarStatus.Paused ? $t('play') : $t('pause')}
    />
    <CircleIconButton buttonSize="50" icon={mdiChevronLeft} onclick={onPrevious} title={$t('previous')} />
    <CircleIconButton buttonSize="50" icon={mdiChevronRight} onclick={onNext} title={$t('next')} />
    <CircleIconButton
      buttonSize="50"
      icon={mdiCog}
      onclick={() => (showSettings = !showSettings)}
      title={$t('slideshow_settings')}
    />
    {#if !isFullScreen}
      <CircleIconButton
        buttonSize="50"
        icon={mdiFullscreen}
        onclick={onSetToFullScreen}
        title={$t('set_slideshow_to_fullscreen')}
      />
    {/if}
  </div>
{/if}
{#if showSettings}
  <SlideshowSettings onClose={() => (showSettings = false)} />
{/if}

<ProgressBar
  autoplay
  hidden={!$showProgressBar}
  duration={$slideshowDelay}
  bind:this={progressBar}
  bind:status={progressBarStatus}
  onDone={handleDone}
/>
