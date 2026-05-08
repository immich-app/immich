<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiImageAlbum, mdiImageOffOutline } from '@mdi/js';

  interface Props {
    selected?: boolean;
    onToggle: (value: boolean | undefined) => void;
  }

  let { selected, onToggle }: Props = $props();
</script>

<div class="flex gap-1.5" data-testid="albums-filter">
  <button
    type="button"
    class="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs {selected === undefined
      ? 'border-immich-primary bg-immich-primary/10 text-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary/20 dark:text-immich-dark-primary'
      : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'}"
    onclick={() => onToggle(undefined)}
    data-testid="albums-all"
  >
    <Icon icon={mdiImageAlbum} size="14" />
    All
  </button>
  <button
    type="button"
    class="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs {selected === true
      ? 'border-immich-primary bg-immich-primary/10 text-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary/20 dark:text-immich-dark-primary'
      : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'}"
    onclick={() => onToggle(true)}
    data-testid="albums-none"
  >
    <Icon icon={mdiImageOffOutline} size="14" />
    Has no album
  </button>
</div>
