<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiSortCalendarAscending, mdiSortCalendarDescending } from '@mdi/js';

  interface Props {
    sortOrder: 'asc' | 'desc';
    onToggle: (order: 'asc' | 'desc') => void;
  }

  let { sortOrder, onToggle }: Props = $props();

  function handleClick() {
    onToggle(sortOrder === 'asc' ? 'desc' : 'asc');
  }

  let icon = $derived(sortOrder === 'asc' ? mdiSortCalendarAscending : mdiSortCalendarDescending);
  let title = $derived(sortOrder === 'asc' ? 'Sort: oldest first' : 'Sort: newest first');
</script>

<button
  type="button"
  class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-subtle dark:text-gray-400"
  onclick={handleClick}
  {title}
  data-testid="sort-toggle"
>
  <Icon {icon} size="18" />
</button>
