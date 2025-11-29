<script lang="ts">
  import { Icon } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    icon: string;
    children?: Snippet;
  }

  let { title, icon, children }: Props = $props();
</script>

<section class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
  <header class="mb-3 flex items-center gap-2">
    <Icon {icon} size="18" class="text-immich-primary dark:text-immich-dark-primary" />
    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</h3>
  </header>

  <div>
    {@render children?.()}
  </div>
</section>
