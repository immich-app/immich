<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ProgressBar, { ProgressBarStatus } from '$lib/components/shared-components/progress-bar/progress-bar.svelte';
  import SlideshowSettings from '$lib/components/slideshow-settings.svelte';
  import { SlideshowNavigation, slideshowStore } from '$lib/stores/slideshow.store';
  import { mdiChevronLeft, mdiChevronRight, mdiClose, mdiCog, mdiFullscreen, mdiPause, mdiPlay } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';

  export let isFullScreen: boolean;
  export let onNext = () => {};
  export let onPrevious = () => {};
  export let onClose = () => {};
  export let onSetToFullScreen = () => {};

  const { restartProgress, stopProgress, slideshowDelay, showProgressBar, slideshowNavigation } = slideshowStore;

  let progressBarStatus: ProgressBarStatus;
  let progressBar: ProgressBar;
  let showSettings = false;
  let showControls = true;
  let timer: NodeJS.Timeout;
  let isOverControls = false;

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
        progressBar.restart(value);
      }
    });

    unsubscribeStop = stopProgress.subscribe((value) => {
      if (value) {
        progressBar.restart(false);
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

  const handleDone = () => {
    if ($slideshowNavigation === SlideshowNavigation.AscendingOrder) {
      onPrevious();
      return;
    }
    onNext();
  };
</script>

<svelte:window
  on:mousemove={showControlBar}
  use:shortcuts={[
    { shortcut: { key: 'Escape' }, onShortcut: onClose },
    { shortcut: { key: 'ArrowLeft' }, onShortcut: onPrevious },
    { shortcut: { key: 'ArrowRight' }, onShortcut: onNext },
  ]}
/>

{#if showControls}
  <div
    class="m-4 flex gap-2"
    on:mouseenter={() => (isOverControls = true)}
    on:mouseleave={() => (isOverControls = false)}
    transition:fly={{ duration: 150 }}
    role="navigation"
  >
    <CircleIconButton buttonSize="50" icon={mdiClose} on:click={onClose} title={$t('exit_slideshow')} />

    <CircleIconButton
      buttonSize="50"
      icon={progressBarStatus === ProgressBarStatus.Paused ? mdiPlay : mdiPause}
      on:click={() => (progressBarStatus === ProgressBarStatus.Paused ? progressBar.play() : progressBar.pause())}
      title={progressBarStatus === ProgressBarStatus.Paused ? $t('play') : $t('pause')}
    />
    <CircleIconButton buttonSize="50" icon={mdiChevronLeft} on:click={onPrevious} title={$t('previous')} />
    <CircleIconButton buttonSize="50" icon={mdiChevronRight} on:click={onNext} title={$t('next')} />
    <CircleIconButton
      buttonSize="50"
      icon={mdiCog}
      on:click={() => (showSettings = !showSettings)}
      title={$t('slideshow_settings')}
    />
    {#if !isFullScreen}
      <CircleIconButton
        buttonSize="50"
        icon={mdiFullscreen}
        on:click={onSetToFullScreen}
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
