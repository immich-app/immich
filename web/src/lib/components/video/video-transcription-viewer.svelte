<script lang="ts">
  export let assetId: string;
  export let segments: Array<{
    startMs: number;
    endMs: number;
    text: string;
    confidence: number;
    speaker?: string;
  }> = [];
  export let currentTimeMs: number = 0;
  export let isTranscribing: boolean = false;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ transcribe: string; seek: number; copy: string }>();

  let showFullText = false;

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  function handleTranscribe() {
    isTranscribing = true;
    dispatch('transcribe', assetId);
  }

  function handleSeek(startMs: number) {
    dispatch('seek', startMs);
  }

  function copyFullText() {
    const text = segments.map((s) => s.text).join(' ');
    dispatch('copy', text);
  }

  $: activeSegmentIndex = segments.findIndex(
    (s) => currentTimeMs >= s.startMs && currentTimeMs < s.endMs,
  );
  $: fullText = segments.map((s) => s.text).join(' ');
</script>

<div class="video-transcription rounded-lg border border-gray-200 dark:border-gray-700 p-4">
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
      <span class="mr-1">📝</span> Transcription
    </h3>
    <div class="flex gap-2">
      {#if segments.length > 0}
        <button
          on:click={() => (showFullText = !showFullText)}
          class="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
        >
          {showFullText ? '📋 Segments' : '📄 Full Text'}
        </button>
        <button
          on:click={copyFullText}
          class="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
        >
          📋 Copy
        </button>
      {/if}
    </div>
  </div>

  {#if segments.length > 0}
    {#if showFullText}
      <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-60 overflow-y-auto">
        {fullText}
      </p>
    {:else}
      <div class="space-y-1 max-h-60 overflow-y-auto">
        {#each segments as segment, i}
          <button
            on:click={() => handleSeek(segment.startMs)}
            class="w-full flex gap-2 px-2 py-1 rounded text-left transition-colors
              {i === activeSegmentIndex
                ? 'bg-indigo-50 dark:bg-indigo-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'}"
          >
            <span class="text-xs text-gray-400 dark:text-gray-500 font-mono w-10 flex-shrink-0 pt-0.5">
              {formatTime(segment.startMs)}
            </span>
            <div class="flex-1">
              {#if segment.speaker}
                <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">{segment.speaker}: </span>
              {/if}
              <span class="text-sm text-gray-700 dark:text-gray-300">{segment.text}</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="flex flex-col items-center gap-2 py-4">
      <p class="text-sm text-gray-500">No transcription available</p>
      <button
        on:click={handleTranscribe}
        disabled={isTranscribing}
        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isTranscribing ? '⏳ Transcribing...' : '🎤 Transcribe Audio'}
      </button>
    </div>
  {/if}
</div>
