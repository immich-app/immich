<script lang="ts">
  export let assetId: string;
  export let highlights: Array<{
    timestampMs: number;
    durationMs: number;
    description: string;
    score: number;
    thumbnailPath?: string;
  }> = [];
  export let isAnalyzing: boolean = false;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ analyze: string; seek: number }>();

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hrs = Math.floor(minutes / 60);
    const secs = seconds % 60;
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function handleAnalyze() {
    isAnalyzing = true;
    dispatch('analyze', assetId);
  }

  function handleSeek(timestampMs: number) {
    dispatch('seek', timestampMs);
  }

  $: sortedHighlights = [...highlights].sort((a, b) => b.score - a.score);
</script>

<div class="video-highlights rounded-lg border border-gray-200 dark:border-gray-700 p-4">
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
      <span class="mr-1">🎬</span> Video Highlights
    </h3>
    <button
      on:click={handleAnalyze}
      disabled={isAnalyzing}
      class="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900 rounded transition-colors disabled:opacity-50"
    >
      {isAnalyzing ? '⏳ Analyzing...' : '🔄 Re-analyze'}
    </button>
  </div>

  {#if highlights.length > 0}
    <div class="space-y-2">
      {#each sortedHighlights as highlight, i}
        <button
          on:click={() => handleSeek(highlight.timestampMs)}
          class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
        >
          <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            {i + 1}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-700 dark:text-gray-300 truncate">{highlight.description}</p>
            <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>⏱ {formatTime(highlight.timestampMs)}</span>
              <span>·</span>
              <span>{formatTime(highlight.durationMs)} long</span>
            </div>
          </div>
          <div class="flex-shrink-0">
            <span class="text-xs px-2 py-0.5 rounded-full {highlight.score >= 0.8 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}">
              {Math.round(highlight.score * 100)}%
            </span>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="flex flex-col items-center gap-2 py-4">
      <p class="text-sm text-gray-500">No highlights detected</p>
      <button
        on:click={handleAnalyze}
        disabled={isAnalyzing}
        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isAnalyzing ? '⏳ Analyzing Video...' : '🎬 Find Highlights'}
      </button>
    </div>
  {/if}
</div>
