<script lang="ts">
  export let assetId: string;
  export let estimatedYear: number | undefined = undefined;
  export let estimatedDecade: string | undefined = undefined;
  export let confidence: number | undefined = undefined;
  export let reasoning: string | undefined = undefined;
  export let signals: string[] = [];
  export let isEstimating: boolean = false;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ estimate: string }>();

  function handleEstimate() {
    isEstimating = true;
    dispatch('estimate', assetId);
  }
</script>

<div class="date-estimation-panel rounded-lg border border-gray-200 dark:border-gray-700 p-4">
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
      <span class="mr-1">📅</span> AI Date Estimate
    </h3>
    {#if confidence !== undefined}
      <span class="text-xs px-2 py-0.5 rounded-full {confidence >= 0.7 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : confidence >= 0.4 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}">
        {Math.round(confidence * 100)}% confident
      </span>
    {/if}
  </div>

  {#if estimatedYear || estimatedDecade}
    <div class="space-y-2">
      <div class="flex items-baseline gap-2">
        {#if estimatedYear}
          <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">~{estimatedYear}</span>
        {/if}
        {#if estimatedDecade}
          <span class="text-sm text-gray-500 dark:text-gray-400">({estimatedDecade})</span>
        {/if}
      </div>

      {#if reasoning}
        <p class="text-xs text-gray-500 dark:text-gray-400 italic">{reasoning}</p>
      {/if}

      {#if signals.length > 0}
        <div class="flex flex-wrap gap-1 mt-1">
          {#each signals as signal}
            <span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full">
              {signal.replace(/_/g, ' ')}
            </span>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex flex-col items-center gap-2 py-3">
      <p class="text-sm text-gray-500">No date information available</p>
      <button
        on:click={handleEstimate}
        disabled={isEstimating}
        class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {#if isEstimating}
          <span class="inline-flex items-center gap-1">
            <span class="animate-spin">🔍</span> Analyzing...
          </span>
        {:else}
          🕰️ Estimate Date
        {/if}
      </button>
    </div>
  {/if}
</div>
