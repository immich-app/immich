<script lang="ts">
  import { fly, fade } from 'svelte/transition';
</script>

<div
  id="onboarding-card"
  class="flex w-full max-w-xl flex-col gap-4 rounded-3xl border bg-white p-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray"
  in:fade={{ duration: 250 }}
>
  <slot />
</div>
