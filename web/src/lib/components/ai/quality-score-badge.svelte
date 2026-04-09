<script lang="ts">
  export let score: number;
  export let factors: string[] = [];

  const getScoreColor = (s: number): string => {
    if (s >= 0.8) return 'text-green-600 dark:text-green-400';
    if (s >= 0.6) return 'text-blue-600 dark:text-blue-400';
    if (s >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (s: number): string => {
    if (s >= 0.8) return 'Excellent';
    if (s >= 0.6) return 'Good';
    if (s >= 0.4) return 'Average';
    return 'Low Quality';
  };

  const getScoreEmoji = (s: number): string => {
    if (s >= 0.8) return '⭐';
    if (s >= 0.6) return '👍';
    if (s >= 0.4) return '🔹';
    return '⚠️';
  };

  $: percentage = Math.round(score * 100);
  $: colorClass = getScoreColor(score);
  $: label = getScoreLabel(score);
  $: emoji = getScoreEmoji(score);
</script>

<div class="quality-badge inline-flex items-center gap-2">
  <div class="flex items-center gap-1">
    <span>{emoji}</span>
    <span class="text-sm font-semibold {colorClass}">{percentage}</span>
    <span class="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
  </div>

  {#if factors.length > 0}
    <div class="flex gap-1">
      {#each factors.slice(0, 3) as factor}
        <span class="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
          {factor.replace(/-/g, ' ')}
        </span>
      {/each}
    </div>
  {/if}

  <span class="text-xs text-gray-400 dark:text-gray-500">{label}</span>
</div>
