<script lang="ts">
  export let tiers: Array<{
    name: string;
    path: string;
    assetCount: number;
    totalSizeBytes: number;
    maxAgeDays: number | null;
  }> = [];
  export let isEvaluating: boolean = false;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ evaluate: void; configure: void }>();

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
  }

  function handleEvaluate() {
    isEvaluating = true;
    dispatch('evaluate');
  }

  $: totalSize = tiers.reduce((sum, t) => sum + t.totalSizeBytes, 0);
  $: totalAssets = tiers.reduce((sum, t) => sum + t.assetCount, 0);
</script>

<div class="storage-tiering rounded-lg border border-gray-200 dark:border-gray-700 p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
      💾 Storage Tiers
    </h3>
    <div class="flex gap-2">
      <button
        on:click={handleEvaluate}
        disabled={isEvaluating}
        class="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900 rounded-lg transition-colors disabled:opacity-50"
      >
        {isEvaluating ? '⏳ Evaluating...' : '🔄 Re-evaluate'}
      </button>
      <button
        on:click={() => dispatch('configure')}
        class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        ⚙️ Configure
      </button>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4 mb-4">
    <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatSize(totalSize)}</p>
      <p class="text-xs text-gray-500">Total Storage</p>
    </div>
    <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">{totalAssets.toLocaleString()}</p>
      <p class="text-xs text-gray-500">Total Assets</p>
    </div>
  </div>

  {#if tiers.length > 0}
    <div class="space-y-3">
      {#each tiers as tier}
        {@const percentage = totalSize > 0 ? (tier.totalSizeBytes / totalSize) * 100 : 0}
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {tier.name === 'hot' ? '🔥' : tier.name === 'warm' ? '🌡️' : tier.name === 'cold' ? '❄️' : '🏔️'}
                {tier.name}
              </span>
              {#if tier.maxAgeDays}
                <span class="text-xs text-gray-400">≤ {tier.maxAgeDays}d</span>
              {/if}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {tier.assetCount.toLocaleString()} assets · {formatSize(tier.totalSizeBytes)}
            </div>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-500 {tier.name === 'hot'
                ? 'bg-red-500'
                : tier.name === 'warm'
                  ? 'bg-orange-500'
                  : tier.name === 'cold'
                    ? 'bg-blue-500'
                    : 'bg-gray-500'}"
              style="width: {percentage}%"
            />
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-center text-sm text-gray-500 py-4">No storage tiers configured</p>
  {/if}
</div>
