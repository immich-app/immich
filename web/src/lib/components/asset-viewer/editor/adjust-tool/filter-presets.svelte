<script lang="ts">
  import { adjustManager, filterPresets } from '$lib/managers/edit/adjust-manager.svelte';
</script>

<div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
  {#each filterPresets as preset (preset.name)}
    <button
      type="button"
      class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
      onclick={() => adjustManager.applyPreset(preset)}
    >
      <div
        class="w-16 h-16 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-colors {adjustManager.activeFilter === preset.name
          ? 'border-immich-primary dark:border-immich-dark-primary bg-immich-primary/10 dark:bg-immich-dark-primary/10'
          : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700'}"
      >
        <span class="text-immich-fg dark:text-immich-dark-fg">{preset.label.slice(0, 3)}</span>
      </div>
      <span
        class="text-xs {adjustManager.activeFilter === preset.name
          ? 'text-immich-primary dark:text-immich-dark-primary font-medium'
          : 'text-immich-fg/70 dark:text-immich-dark-fg/70'}"
      >
        {preset.label}
      </span>
    </button>
  {/each}
</div>
