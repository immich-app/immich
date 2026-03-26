<script lang="ts">
  import { TrimManager } from '$lib/managers/edit/trim-manager.svelte';

  interface Props {
    trimManager: TrimManager;
  }

  let { trimManager }: Props = $props();

  let trackElement: HTMLDivElement | undefined = $state();
  let dragging = $state<'start' | 'end' | null>(null);
  let lastSeekTime = 0;
  const SEEK_THROTTLE_MS = 100;

  const formatTime = TrimManager.formatTime;

  function pctToTime(pct: number): number {
    return Math.max(0, Math.min(trimManager.duration, pct * trimManager.duration));
  }

  function getPointerPct(clientX: number): number {
    if (!trackElement) {
      return 0;
    }
    const rect = trackElement.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function throttledSeek(time: number) {
    const now = Date.now();
    if (now - lastSeekTime >= SEEK_THROTTLE_MS) {
      trimManager.seekTo(time);
      lastSeekTime = now;
    }
  }

  function onHandlePointerDown(handle: 'start' | 'end', event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragging = handle;

    const onMove = (e: PointerEvent) => {
      const pct = getPointerPct(e.clientX);
      const time = pctToTime(pct);

      if (dragging === 'start') {
        trimManager.setStart(time);
        throttledSeek(trimManager.startTime);
      } else if (dragging === 'end') {
        trimManager.setEnd(time);
        throttledSeek(trimManager.endTime);
      }
    };

    const onUp = () => {
      // Final precise seek
      if (dragging === 'start') {
        trimManager.seekTo(trimManager.startTime);
      } else if (dragging === 'end') {
        trimManager.seekTo(trimManager.endTime);
      }
      dragging = null;
      globalThis.removeEventListener('pointermove', onMove);
      globalThis.removeEventListener('pointerup', onUp);
    };

    globalThis.addEventListener('pointermove', onMove);
    globalThis.addEventListener('pointerup', onUp);
  }

  function onTrackClick(event: MouseEvent) {
    if (dragging) {
      return;
    }
    const pct = getPointerPct(event.clientX);
    const time = pctToTime(pct);
    trimManager.seekTo(time);
  }

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    if (event.key === 'i' || event.key === 'I') {
      event.preventDefault();
      trimManager.setStart(trimManager.currentTime);
    }

    if (event.key === 'o' || event.key === 'O') {
      event.preventDefault();
      trimManager.setEnd(trimManager.currentTime);
    }

    if (event.code === 'Space') {
      event.preventDefault();
      if (trimManager.isPlaying) {
        trimManager.seekTo(trimManager.currentTime); // pause handled by video element
      }
      // Toggle play is handled by video element space key — but since we suppress it here we need to manually toggle
      togglePlayPause();
    }
  }

  function togglePlayPause() {
    trimManager.togglePlayPause();
  }

  function nudgeHandle(handle: 'start' | 'end', delta: number) {
    if (handle === 'start') {
      trimManager.setStart(trimManager.startTime + delta);
      trimManager.seekTo(trimManager.startTime);
    } else {
      trimManager.setEnd(trimManager.endTime + delta);
      trimManager.seekTo(trimManager.endTime);
    }
  }

  function onHandleKeydown(handle: 'start' | 'end', event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nudgeHandle(handle, -0.5);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nudgeHandle(handle, 0.5);
    }
  }

  // Generate time labels for the bottom tick marks
  let timeLabels = $derived.by(() => {
    const d = trimManager.duration;
    if (d <= 0) {
      return [];
    }
    const count = 5;
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push(formatTime((d / (count - 1)) * i));
    }
    return labels;
  });

  let startPctStyle = $derived(`${trimManager.startPercent * 100}%`);
  let endPctStyle = $derived(`${(1 - trimManager.endPercent) * 100}%`);
  let playheadPctStyle = $derived(`${trimManager.currentPercent * 100}%`);
  let handleInStyle = $derived(`calc(${trimManager.startPercent * 100}% - 14px)`);
  let handleOutStyle = $derived(`${trimManager.endPercent * 100}%`);
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="relative h-12 rounded-md bg-gray-800 cursor-pointer select-none"
  role="slider"
  tabindex="-1"
  aria-label="Video timeline"
  aria-valuenow={Math.round(trimManager.currentTime)}
  aria-valuemin={0}
  aria-valuemax={Math.round(trimManager.duration)}
  bind:this={trackElement}
  onclick={onTrackClick}
  onkeydown={handleKeydown}
>
  <!-- Dimmed left region -->
  <div class="absolute top-0 left-0 h-full rounded-l-md bg-black/70 z-[2]" style:width={startPctStyle}></div>

  <!-- Dimmed right region -->
  <div class="absolute top-0 right-0 h-full rounded-r-md bg-black/70 z-[2]" style:width={endPctStyle}></div>

  <!-- Trim region (kept) -->
  <div
    class="absolute top-0 h-full z-[1] border-t-2 border-b-2 border-immich-primary/60"
    style:left={startPctStyle}
    style:right={endPctStyle}
  >
    <!-- Time labels above trim region -->
    <div class="absolute -top-5.5 z-[6] flex w-full justify-between pointer-events-none">
      <span class="text-[0.65rem] font-medium text-immich-primary tabular-nums bg-gray-900/80 px-1 rounded-sm">
        {formatTime(trimManager.startTime)}
      </span>
      <span class="text-[0.65rem] font-medium text-immich-primary tabular-nums bg-gray-900/80 px-1 rounded-sm">
        {formatTime(trimManager.endTime)}
      </span>
    </div>
  </div>

  <!-- In handle -->
  <div
    class="absolute -top-0.5 w-3.5 z-[4] flex items-center justify-center rounded-l bg-immich-primary/85 hover:bg-immich-primary cursor-col-resize transition-colors"
    style:left={handleInStyle}
    style:height="calc(100% + 4px)"
    role="slider"
    tabindex={0}
    aria-label="Trim start"
    aria-valuenow={Math.round(trimManager.startTime * 10) / 10}
    aria-valuemin={0}
    aria-valuemax={Math.round(trimManager.endTime * 10) / 10}
    onpointerdown={(e) => onHandlePointerDown('start', e)}
    onkeydown={(e) => onHandleKeydown('start', e)}
  >
    <div class="flex flex-col gap-[3px]">
      <span class="block w-1.5 h-[1.5px] bg-black/70 rounded-sm"></span>
      <span class="block w-1.5 h-[1.5px] bg-black/70 rounded-sm"></span>
      <span class="block w-1.5 h-[1.5px] bg-black/70 rounded-sm"></span>
    </div>
  </div>

  <!-- Out handle -->
  <div
    class="absolute -top-0.5 w-3.5 z-[4] flex items-center justify-center rounded-r bg-immich-primary/85 hover:bg-immich-primary cursor-col-resize transition-colors"
    style:left={handleOutStyle}
    style:height="calc(100% + 4px)"
    role="slider"
    tabindex={0}
    aria-label="Trim end"
    aria-valuenow={Math.round(trimManager.endTime * 10) / 10}
    aria-valuemin={Math.round(trimManager.startTime * 10) / 10}
    aria-valuemax={Math.round(trimManager.duration * 10) / 10}
    onpointerdown={(e) => onHandlePointerDown('end', e)}
    onkeydown={(e) => onHandleKeydown('end', e)}
  >
    <div class="flex flex-col gap-[3px]">
      <span class="block w-1.5 h-[1.5px] bg-black/70 rounded-sm"></span>
      <span class="block w-1.5 h-[1.5px] bg-black/70 rounded-sm"></span>
      <span class="block w-1.5 h-[1.5px] bg-black/70 rounded-sm"></span>
    </div>
  </div>

  <!-- Playhead -->
  <div
    class="absolute -top-1 w-0.5 z-[5] bg-white rounded-sm pointer-events-none shadow-[0_0_6px_rgba(255,255,255,0.3)]"
    style:left={playheadPctStyle}
    style:height="calc(100% + 8px)"
  >
    <div
      class="absolute -top-[3px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.4)]"
    ></div>
  </div>
</div>

<!-- Full duration tick labels -->
<div class="flex justify-between mt-2 px-0.5 text-[0.7rem] text-gray-500 tabular-nums">
  {#each timeLabels as label, i (i)}
    <span>{label}</span>
  {/each}
</div>
