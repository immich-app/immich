<script lang="ts" context="module">
  export type Color = 'success' | 'warning';
</script>

<script lang="ts">
  export let color: Color;

  const colorClasses: Record<Color, string> = {
    success: 'bg-green-500/70 text-gray-900 dark:bg-green-700/90 dark:text-gray-100',
    warning: 'bg-orange-400/70 text-gray-900 dark:bg-orange-900 dark:text-gray-100',
  };
</script>

<div class="w-full p-2 text-center text-sm {colorClasses[color]}">
  <slot />
</div>
