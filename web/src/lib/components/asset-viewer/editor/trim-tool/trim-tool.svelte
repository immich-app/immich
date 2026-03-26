<script lang="ts">
  import { trimManager, TrimManager } from '$lib/managers/edit/trim-manager.svelte';

  const formatTime = TrimManager.formatTime;

  function parseTime(value: string): number | undefined {
    const match = value.match(/^(\d+):(\d{2})(?:\.(\d))?$/);
    if (!match) {
      return undefined;
    }
    const [, minutes, seconds, tenths] = match;
    return Number(minutes) * 60 + Number(seconds) + (tenths ? Number(tenths) / 10 : 0);
  }

  let inValue = $state('');
  let outValue = $state('');

  // Keep inputs in sync with manager state when not focused
  let inFocused = $state(false);
  let outFocused = $state(false);

  let displayIn = $derived(inFocused ? inValue : formatTime(trimManager.startTime));
  let displayOut = $derived(outFocused ? outValue : formatTime(trimManager.endTime));

  function onInFocus() {
    inValue = formatTime(trimManager.startTime);
    inFocused = true;
  }

  function onOutFocus() {
    outValue = formatTime(trimManager.endTime);
    outFocused = true;
  }

  function onInBlur() {
    inFocused = false;
    const parsed = parseTime(inValue);
    if (parsed !== undefined) {
      trimManager.setStart(parsed);
      trimManager.seekTo(trimManager.startTime);
    }
  }

  function onOutBlur() {
    outFocused = false;
    const parsed = parseTime(outValue);
    if (parsed !== undefined) {
      trimManager.setEnd(parsed);
      trimManager.seekTo(trimManager.endTime);
    }
  }

  function setIn() {
    trimManager.setStart(trimManager.currentTime);
  }

  function setOut() {
    trimManager.setEnd(trimManager.currentTime);
  }
</script>

<div class="mt-3 px-4 flex flex-col gap-5">
  <!-- Trimmed Duration -->
  <div class="flex flex-col gap-1">
    <span class="text-[0.65rem] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
      Trimmed Duration
    </span>
    <span class="text-2xl font-bold text-immich-fg dark:text-immich-dark-fg tabular-nums tracking-tight">
      {formatTime(trimManager.trimmedDuration)}
    </span>
  </div>

  <!-- In / Out Time Inputs -->
  <div class="flex flex-col gap-2">
    <div class="flex gap-2">
      <div class="flex-1 flex flex-col gap-1">
        <label for="trim-in" class="text-[0.6rem] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
          In
        </label>
        <input
          id="trim-in"
          type="text"
          class="bg-gray-800 dark:bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-immich-fg dark:text-immich-dark-fg tabular-nums outline-none focus:border-immich-primary/50 transition-colors"
          value={displayIn}
          onfocus={onInFocus}
          onblur={onInBlur}
          oninput={(e) => (inValue = e.currentTarget.value)}
        />
      </div>
      <div class="flex-1 flex flex-col gap-1">
        <label
          for="trim-out"
          class="text-[0.6rem] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium"
        >
          Out
        </label>
        <input
          id="trim-out"
          type="text"
          class="bg-gray-800 dark:bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-immich-fg dark:text-immich-dark-fg tabular-nums outline-none focus:border-immich-primary/50 transition-colors"
          value={displayOut}
          onfocus={onOutFocus}
          onblur={onOutBlur}
          oninput={(e) => (outValue = e.currentTarget.value)}
        />
      </div>
    </div>

    <!-- Set In / Set Out buttons -->
    <div class="flex gap-1.5">
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-gray-300 hover:border-gray-600 transition-all cursor-pointer"
        onclick={setIn}
      >
        Set In
        <kbd class="text-[0.6rem] bg-gray-700 rounded px-1 text-gray-500">I</kbd>
      </button>
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-gray-300 hover:border-gray-600 transition-all cursor-pointer"
        onclick={setOut}
      >
        Set Out
        <kbd class="text-[0.6rem] bg-gray-700 rounded px-1 text-gray-500">O</kbd>
      </button>
    </div>
  </div>

  <div class="h-px bg-gray-700"></div>

  <!-- Original Duration -->
  <div class="flex flex-col gap-1">
    <span class="text-[0.65rem] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
      Original
    </span>
    <span class="text-sm text-gray-500 tabular-nums">
      {formatTime(trimManager.duration)}
    </span>
  </div>

  <!-- Reset button -->
  {#if trimManager.hasChanges}
    <button
      type="button"
      class="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer self-start"
      onclick={() => trimManager.resetAllChanges()}
    >
      Reset to full duration
    </button>
  {/if}
</div>
