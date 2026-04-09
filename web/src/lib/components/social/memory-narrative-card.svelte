<script lang="ts">
  export let narrative: string = '';
  export let memoryTitle: string = '';
  export let memoryDate: string = '';
  export let assetCount: number = 0;
  export let isGenerating: boolean = false;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ regenerate: void; share: void }>();

  function handleRegenerate() {
    isGenerating = true;
    dispatch('regenerate');
  }
</script>

<div class="memory-narrative rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border border-indigo-100 dark:border-indigo-800">
  <div class="p-5">
    <div class="flex items-start justify-between mb-3">
      <div>
        <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
          {memoryDate ? new Date(memoryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Memory'}
        </p>
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mt-0.5">
          {memoryTitle || 'A Beautiful Memory'}
        </h3>
      </div>
      <span class="text-xs text-gray-500 dark:text-gray-400">📸 {assetCount} photos</span>
    </div>

    {#if narrative}
      <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
        "{narrative}"
      </p>
    {:else if isGenerating}
      <div class="flex items-center gap-2 py-2">
        <span class="animate-pulse text-sm text-indigo-500">✨ Crafting your memory story...</span>
      </div>
    {:else}
      <p class="text-sm text-gray-500 italic">No narrative generated yet</p>
    {/if}

    <div class="flex items-center gap-2 mt-4">
      <button
        on:click={handleRegenerate}
        disabled={isGenerating}
        class="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 transition-colors disabled:opacity-50"
      >
        {isGenerating ? '⏳ Writing...' : '✨ Regenerate'}
      </button>
      <button
        on:click={() => dispatch('share')}
        class="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 transition-colors"
      >
        🔗 Share
      </button>
    </div>
  </div>
</div>
