<script lang="ts">
  import { fade } from 'svelte/transition';
</script>

<div
  id="onboarding-card"
  class="flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-gray-500 px-8 py-14 dark:border-immich-dark-gray dark:bg-immich-dark-gray text-black dark:text-immich-dark-fg bg-gray-50"
  in:fade={{ duration: 250 }}
>
  <slot />
</div>
