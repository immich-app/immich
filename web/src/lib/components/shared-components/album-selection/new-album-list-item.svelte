<script lang="ts">
  import { SCROLL_PROPERTIES } from '$lib/components/shared-components/album-selection/album-selection-utils';
  import { Icon } from '@immich/ui';
  import { mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { Action } from 'svelte/action';

  interface Props {
    searchQuery?: string;
    selected: boolean;
    onNewAlbum: (search: string) => void;
  }

  let { searchQuery = '', selected = false, onNewAlbum }: Props = $props();

  const scrollIntoViewIfSelected: Action = (node) => {
    $effect(() => {
      if (selected) {
        node.scrollIntoView(SCROLL_PROPERTIES);
      }
    });
  };
</script>

<button
  type="button"
  onclick={() => onNewAlbum(searchQuery)}
  use:scrollIntoViewIfSelected
  class="flex w-full items-center gap-4 px-6 py-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl"
  class:bg-gray-200={selected}
  class:dark:bg-gray-700={selected}
>
  <div class="flex h-12 w-12 items-center justify-center">
    <Icon icon={mdiPlus} size="30" />
  </div>
  <p class="">
    {$t('new_album')}
    {#if searchQuery.length > 0}<b>{searchQuery}</b>{/if}
  </p>
</button>
