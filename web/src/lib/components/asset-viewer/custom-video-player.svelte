<script lang="ts">
  import { browser } from '$app/environment';
  import {
    mdiFullscreen,
    mdiFullscreenExit,
    mdiLoading,
    mdiPause,
    mdiPlay,
    mdiVolumeHigh,
    mdiVolumeMedium,
    mdiVolumeLow,
    mdiVolumeOff,
  } from '@mdi/js';
  import { Icon } from '@immich/ui';
  import { onDestroy, onMount, tick } from 'svelte';

  interface Props {
    src: string;
    poster?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    volume?: number;
    onCanPlay?: (video: HTMLVideoElement) => void;
    onEnded?: () => void;
    onVolumeChange?: (event: Event) => void;
    onSeeking?: () => void;
    onSeeked?: () => void;
    onPlaying?: (event: Event) => void;
    onClose?: () => void;
    swipeAction?: (node: HTMLElement) => { destroy?: () => void };
    videoElement?: HTMLVideoElement;
    isBuffering?: boolean;
  }

  let {
    src,
    poster,
    autoplay = false,
    loop = false,
    muted = $bindable(false),
    volume = $bindable(1),
    onCanPlay,
    onEnded,
    onVolumeChange,
    onSeeking,
    onSeeked,
    onPlaying,
    onClose,
    swipeAction,
    videoElement = $bindable(),
    isBuffering = $bindable(false),
  }: Props = $props();

  let playerContainer: HTMLDivElement | undefined = $state();
  let controlsVisible = $state(true);
  let controlsTimeout: ReturnType<typeof setTimeout> | undefined;
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let bufferedEnd = $state(0);
  let isFullscreen = $state(false);
  let isSeeking = $state(false);
  let seekPreviewTime = $state(0);
  let progressBarEl: HTMLDivElement | undefined = $state();
  let volumeSliderVisible = $state(false);
  let volumeTimeout: ReturnType<typeof setTimeout> | undefined;

  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = (vol: number, isMuted: boolean): string => {
    if (isMuted || vol === 0) return mdiVolumeOff;
    if (vol < 0.33) return mdiVolumeLow;
    if (vol < 0.66) return mdiVolumeMedium;
    return mdiVolumeHigh;
  };

  const showControls = () => {
    controlsVisible = true;
    clearTimeout(controlsTimeout);
    if (isPlaying) {
      controlsTimeout = setTimeout(() => {
        if (isPlaying && !isSeeking && !volumeSliderVisible) {
          controlsVisible = false;
        }
      }, 3000);
    }
  };

  const togglePlay = () => {
    if (!videoElement) return;
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  };

  const toggleMute = () => {
    muted = !muted;
  };

  const toggleFullscreen = async () => {
    if (!playerContainer) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await playerContainer.requestFullscreen();
      }
    } catch {
      // fullscreen not supported
    }
  };

  const handleProgressClick = (event: MouseEvent) => {
    if (!progressBarEl || !videoElement) return;
    const rect = progressBarEl.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    videoElement.currentTime = fraction * duration;
  };

  const handleProgressMouseDown = (event: MouseEvent) => {
    isSeeking = true;
    handleProgressClick(event);

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressBarEl || !videoElement) return;
      const rect = progressBarEl.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seekPreviewTime = fraction * duration;
      videoElement.currentTime = seekPreviewTime;
    };

    const handleMouseUp = () => {
      isSeeking = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      showControls();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleProgressTouch = (event: TouchEvent) => {
    if (!progressBarEl || !videoElement) return;
    const touch = event.touches[0];
    const rect = progressBarEl.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    videoElement.currentTime = fraction * duration;
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!videoElement) return;
    switch (event.key) {
      case ' ':
      case 'k': {
        event.preventDefault();
        togglePlay();
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        videoElement.currentTime = Math.max(0, videoElement.currentTime - 5);
        showControls();
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        videoElement.currentTime = Math.min(duration, videoElement.currentTime + 5);
        showControls();
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        volume = Math.min(1, volume + 0.1);
        showControls();
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        volume = Math.max(0, volume - 0.1);
        showControls();
        break;
      }
      case 'f': {
        event.preventDefault();
        toggleFullscreen();
        break;
      }
      case 'm': {
        event.preventDefault();
        toggleMute();
        break;
      }
    }
  };

  const updateBuffered = () => {
    if (!videoElement || videoElement.buffered.length === 0) {
      bufferedEnd = 0;
      return;
    }
    // Find the buffered range that contains the current time
    for (let i = 0; i < videoElement.buffered.length; i++) {
      if (
        videoElement.buffered.start(i) <= videoElement.currentTime &&
        videoElement.buffered.end(i) >= videoElement.currentTime
      ) {
        bufferedEnd = videoElement.buffered.end(i);
        return;
      }
    }
    bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
  };

  const handleVolumeInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    volume = Number.parseFloat(target.value);
    if (volume > 0) {
      muted = false;
    }
  };

  const handleFullscreenChange = () => {
    isFullscreen = !!document.fullscreenElement;
  };

  onMount(() => {
    if (browser) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
    }
    showControls();
  });

  onDestroy(() => {
    clearTimeout(controlsTimeout);
    clearTimeout(volumeTimeout);
    if (browser) {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
  });

  let progressPercent = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
  let bufferedPercent = $derived(duration > 0 ? (bufferedEnd / duration) * 100 : 0);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  bind:this={playerContainer}
  class="custom-video-player group relative flex h-full w-full items-center justify-center bg-black"
  onmousemove={showControls}
  onmouseleave={() => {
    if (isPlaying && !isSeeking) controlsVisible = false;
  }}
  onkeydown={handleKeydown}
  role="application"
  tabindex="-1"
>
  <!-- Video Element -->
  <video
    bind:this={videoElement}
    class="h-full w-full object-contain"
    {src}
    {poster}
    {autoplay}
    {loop}
    {muted}
    bind:volume
    playsinline
    disablePictureInPicture
    oncanplay={(e) => onCanPlay?.(e.currentTarget)}
    onended={onEnded}
    onvolumechange={onVolumeChange}
    onseeking={() => onSeeking?.()}
    onseeked={() => onSeeked?.()}
    onplaying={(e) => onPlaying?.(e)}
    onclick={togglePlay}
    ondblclick={toggleFullscreen}
    onplay={() => {
      isPlaying = true;
      showControls();
    }}
    onpause={() => {
      isPlaying = false;
      controlsVisible = true;
    }}
    ontimeupdate={() => {
      if (videoElement) {
        currentTime = videoElement.currentTime;
        updateBuffered();
      }
    }}
    onloadedmetadata={() => {
      if (videoElement) duration = videoElement.duration;
    }}
    onprogress={updateBuffered}
    onwaiting={() => (isBuffering = true)}
    oncanplaythrough={() => (isBuffering = false)}
  ></video>

  <!-- Buffering Spinner -->
  {#if isBuffering && isPlaying}
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="animate-spin">
        <Icon icon={mdiLoading} size="48" class="text-white opacity-80" />
      </div>
    </div>
  {/if}

  <!-- Big Play Button (shown when paused) -->
  {#if !isPlaying && controlsVisible && !isBuffering}
    <button
      class="absolute inset-0 flex items-center justify-center"
      onclick={togglePlay}
      aria-label="Play"
    >
      <div
        class="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-110"
      >
        <Icon icon={mdiPlay} size="36" class="ml-1 text-white" />
      </div>
    </button>
  {/if}

  <!-- Controls Overlay -->
  <div
    class="absolute inset-x-0 bottom-0 transition-opacity duration-300"
    class:opacity-0={!controlsVisible}
    class:pointer-events-none={!controlsVisible}
  >
    <!-- Gradient Background -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

    <div class="relative px-3 pb-3 pt-8">
      <!-- Progress Bar -->
      <div
        bind:this={progressBarEl}
        class="group/progress mb-2 flex h-5 cursor-pointer items-center"
        onmousedown={handleProgressMouseDown}
        ontouchstart={handleProgressTouch}
        ontouchmove={handleProgressTouch}
        role="slider"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabindex={0}
      >
        <div class="relative h-1 w-full rounded-full bg-white/30 transition-all group-hover/progress:h-1.5">
          <!-- Buffered -->
          <div
            class="absolute top-0 left-0 h-full rounded-full bg-white/40"
            style="width: {bufferedPercent}%"
          ></div>
          <!-- Progress -->
          <div
            class="absolute top-0 left-0 h-full rounded-full bg-immich-primary dark:bg-immich-dark-primary"
            style="width: {progressPercent}%"
          ></div>
          <!-- Seek Handle -->
          <div
            class="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-immich-primary opacity-0 shadow-md transition-opacity group-hover/progress:opacity-100 dark:bg-immich-dark-primary"
            style="left: {progressPercent}%"
          ></div>
        </div>
      </div>

      <!-- Bottom Controls Row -->
      <div class="flex items-center gap-2">
        <!-- Play/Pause -->
        <button
          class="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
          onclick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <Icon icon={isPlaying ? mdiPause : mdiPlay} size="24" class="text-white" />
        </button>

        <!-- Volume -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="flex items-center"
          onmouseenter={() => {
            clearTimeout(volumeTimeout);
            volumeSliderVisible = true;
          }}
          onmouseleave={() => {
            volumeTimeout = setTimeout(() => (volumeSliderVisible = false), 300);
          }}
        >
          <button
            class="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
            onclick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            <Icon icon={getVolumeIcon(volume, muted)} size="22" class="text-white" />
          </button>
          <div
            class="overflow-hidden transition-all duration-200"
            class:w-20={volumeSliderVisible}
            class:w-0={!volumeSliderVisible}
            class:opacity-0={!volumeSliderVisible}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              oninput={handleVolumeInput}
              class="volume-slider h-1 w-full cursor-pointer accent-immich-primary dark:accent-immich-dark-primary"
            />
          </div>
        </div>

        <!-- Time Display -->
        <span class="select-none text-xs text-white/90">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Fullscreen -->
        <button
          class="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
          onclick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Icon icon={isFullscreen ? mdiFullscreenExit : mdiFullscreen} size="24" class="text-white" />
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .custom-video-player {
    --player-accent: var(--immich-primary, 66 80 175);
  }

  .custom-video-player:fullscreen {
    background-color: black;
  }

  video::-webkit-media-controls {
    display: none !important;
  }

  video::-webkit-media-controls-enclosure {
    display: none !important;
  }

  .volume-slider {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
  }

  .volume-slider::-webkit-slider-runnable-track {
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    margin-top: -4px;
    cursor: pointer;
  }

  .volume-slider::-moz-range-track {
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }

  .volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    border: none;
    cursor: pointer;
  }
</style>
