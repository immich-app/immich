<script lang="ts">
  import { Breadcrumbs, type BreadcrumbItem } from '@immich/ui';
  import { mdiSlashForward } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    breadcrumbs: BreadcrumbItem[];
    buttons?: Snippet;
    children?: Snippet;
  };

  let { breadcrumbs, buttons, children }: Props = $props();
</script>

<div class="h-full flex flex-col">
  <div class="flex h-16 w-full place-items-center justify-between border-b p-2">
    <Breadcrumbs items={breadcrumbs} separator={mdiSlashForward} />
    {@render buttons?.()}
  </div>
  {@render children?.()}
</div>
