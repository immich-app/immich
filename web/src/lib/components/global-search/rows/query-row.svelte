<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiMagnify } from '@mdi/js';

  interface Props {
    entry: { text: string };
  }

  let { entry }: Props = $props();
</script>

<div
  data-testid="query-row"
  class="flex h-[52px] items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-[80ms] ease-out group-data-[selected]:bg-primary/10"
>
  <div class="flex h-10 w-10 items-center justify-center rounded-md bg-subtle/40">
    <Icon icon={mdiMagnify} size="1.125em" class="text-gray-500 dark:text-gray-400" />
  </div>
  <div class="min-w-0 flex-1">
    <div class="truncate text-sm font-medium">{entry.text}</div>
  </div>
</div>
