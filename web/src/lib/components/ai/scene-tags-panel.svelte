<script lang="ts">
  export let tags: Array<{ tag: string; category: string; confidence: number }> = [];
  export let assetId: string;
  export let isTagging: boolean = false;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ generate: string; remove: { assetId: string; tag: string } }>();

  const categoryColors: Record<string, string> = {
    event: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    location: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    activity: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    weather: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    object: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    time_of_day: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  const categoryIcons: Record<string, string> = {
    event: '🎉',
    location: '📍',
    activity: '🏃',
    weather: '🌤️',
    object: '📦',
    time_of_day: '🕐',
  };

  function handleGenerate() {
    isTagging = true;
    dispatch('generate', assetId);
  }

  function handleRemove(tag: string) {
    dispatch('remove', { assetId, tag });
  }

  $: sortedTags = [...tags].sort((a, b) => b.confidence - a.confidence);
  $: groupedTags = sortedTags.reduce(
    (acc, tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      acc[tag.category].push(tag);
      return acc;
    },
    {} as Record<string, typeof tags>,
  );
</script>

<div class="scene-tags-panel rounded-lg border border-gray-200 dark:border-gray-700 p-4">
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
      <span class="mr-1">🏷️</span> Scene Tags
    </h3>
    <button
      on:click={handleGenerate}
      disabled={isTagging}
      class="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900 rounded transition-colors disabled:opacity-50"
    >
      {isTagging ? '⏳ Tagging...' : '🔄 Re-analyze'}
    </button>
  </div>

  {#if tags.length > 0}
    <div class="space-y-2">
      {#each Object.entries(groupedTags) as [category, categoryTags]}
        <div>
          <span class="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider">
            {categoryIcons[category] || '•'} {category.replace(/_/g, ' ')}
          </span>
          <div class="flex flex-wrap gap-1 mt-1">
            {#each categoryTags as tag}
              <span
                class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full {categoryColors[category] || 'bg-gray-100 text-gray-800'}"
              >
                {tag.tag.replace(/_/g, ' ')}
                <span class="opacity-60">{Math.round(tag.confidence * 100)}%</span>
                <button
                  on:click={() => handleRemove(tag.tag)}
                  class="ml-0.5 opacity-40 hover:opacity-100"
                  title="Remove tag"
                >
                  ×
                </button>
              </span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex flex-col items-center gap-2 py-3">
      <p class="text-sm text-gray-500">No scene tags yet</p>
      <button
        on:click={handleGenerate}
        disabled={isTagging}
        class="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {isTagging ? '⏳ Analyzing...' : '🏷️ Generate Scene Tags'}
      </button>
    </div>
  {/if}
</div>
