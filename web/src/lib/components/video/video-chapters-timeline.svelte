<script lang="ts">
  export let assetId: string;
  export let chapters: Array<{
    startMs: number;
    endMs: number;
    title: string;
    description: string;
  }> = [];
  export let currentTimeMs: number = 0;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ seek: number }>();

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  function handleSeek(startMs: number) {
    dispatch('seek', startMs);
  }

  $: activeChapterIndex = chapters.findIndex(
    (c) => currentTimeMs >= c.startMs && currentTimeMs < c.endMs,
  );
</script>

<div class="video-chapters">
  {#if chapters.length > 0}
    <div class="space-y-1">
      <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        📑 Chapters
      </h4>
      {#each chapters as chapter, i}
        <button
          on:click={() => handleSeek(chapter.startMs)}
          class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors
            {i === activeChapterIndex
              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-indigo-500'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-2 border-transparent'}"
        >
          <span class="text-xs text-gray-400 dark:text-gray-500 font-mono w-10 flex-shrink-0">
            {formatTime(chapter.startMs)}
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {chapter.title}
            </p>
            {#if chapter.description && i === activeChapterIndex}
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {chapter.description}
              </p>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
