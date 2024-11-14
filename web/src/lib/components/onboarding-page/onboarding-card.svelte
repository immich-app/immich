<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    title?: string | undefined;
    icon?: string | undefined;
    children?: Snippet;
  }

  let { title = undefined, icon = undefined, children }: Props = $props();
</script>

<div
  id="onboarding-card"
  class="flex w-full max-w-4xl flex-col gap-4 rounded-3xl border-2 border-gray-500 px-8 py-8 dark:border-immich-dark-gray dark:bg-immich-dark-gray text-black dark:text-immich-dark-fg bg-gray-50"
  in:fade={{ duration: 250 }}
>
  {#if title || icon}
    <div class="flex gap-2 items-center justify-center w-fit">
      {#if icon}
        <Icon path={icon} size="30" class="text-immich-primary dark:text-immich-dark-primary" />
      {/if}
      {#if title}
        <p class="text-xl text-immich-primary dark:text-immich-dark-primary">
          {title.toUpperCase()}
        </p>
      {/if}
    </div>
  {/if}
  {@render children?.()}
</div>
