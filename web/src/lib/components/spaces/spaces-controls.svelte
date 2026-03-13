<script lang="ts">
  import { SortOrder } from '$lib/stores/preferences.store';
  import { sortOptionsMetadata, SpaceSortBy, spaceViewSettings } from '$lib/stores/space-view.store';
  import type { SharedSpaceResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiArrowDownThin, mdiArrowUpThin, mdiFormatListBulletedSquare, mdiSort, mdiViewGridOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    spaces: SharedSpaceResponseDto[];
    onSorted: (sorted: SharedSpaceResponseDto[]) => void;
  }

  let { spaces, onSorted }: Props = $props();

  let showDropdown = $state(false);

  const flipOrdering = (ordering: string) => {
    return ordering === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
  };

  const handleSort = (option: (typeof sortOptionsMetadata)[0]) => {
    if ($spaceViewSettings.sortBy === option.id) {
      $spaceViewSettings.sortOrder = flipOrdering($spaceViewSettings.sortOrder);
    } else {
      $spaceViewSettings.sortBy = option.id;
      $spaceViewSettings.sortOrder = option.defaultOrder;
    }
    showDropdown = false;
  };

  const sortSpaces = (items: SharedSpaceResponseDto[], sortBy: string, sortOrder: string) => {
    const sorted = [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case SpaceSortBy.Name: {
          comparison = a.name.localeCompare(b.name);
          break;
        }
        case SpaceSortBy.LastActivity: {
          const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
        }
        case SpaceSortBy.DateCreated: {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        }
        case SpaceSortBy.AssetCount: {
          comparison = (a.assetCount ?? 0) - (b.assetCount ?? 0);
          break;
        }
      }
      return sortOrder === SortOrder.Asc ? comparison : -comparison;
    });
    return sorted;
  };

  $effect(() => {
    const sorted = sortSpaces(spaces, $spaceViewSettings.sortBy, $spaceViewSettings.sortOrder);
    onSorted(sorted);
  });

  let sortIcon = $derived($spaceViewSettings.sortOrder === SortOrder.Desc ? mdiArrowDownThin : mdiArrowUpThin);
  let activeLabel = $derived(
    sortOptionsMetadata.find((o) => o.id === $spaceViewSettings.sortBy)?.label ?? ('last_activity' as const),
  );
</script>

<div class="relative mb-4 flex items-center justify-end gap-2" data-testid="spaces-controls">
  <button
    type="button"
    class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
    onclick={() => ($spaceViewSettings.viewMode = $spaceViewSettings.viewMode === 'card' ? 'list' : 'card')}
    data-testid="view-toggle"
  >
    <Icon icon={$spaceViewSettings.viewMode === 'card' ? mdiFormatListBulletedSquare : mdiViewGridOutline} size="18" />
  </button>

  <button
    type="button"
    class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
    onclick={() => (showDropdown = !showDropdown)}
    data-testid="sort-button"
  >
    <Icon icon={mdiSort} size="18" />
    <span>{$t(activeLabel)}</span>
    <Icon icon={sortIcon} size="18" />
  </button>

  {#if showDropdown}
    <div
      class="absolute top-full right-0 z-10 mt-1 min-w-[180px] rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
      data-testid="sort-dropdown"
    >
      {#each sortOptionsMetadata as option (option.id)}
        <button
          type="button"
          class="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          class:font-semibold={$spaceViewSettings.sortBy === option.id}
          onclick={() => handleSort(option)}
          data-testid="sort-option-{option.id}"
        >
          <span>{$t(option.label)}</span>
          {#if $spaceViewSettings.sortBy === option.id}
            <Icon icon={sortIcon} size="16" />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
