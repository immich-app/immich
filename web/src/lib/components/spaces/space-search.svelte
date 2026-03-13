<script lang="ts">
  import { searchSmart, type AssetResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiClose, mdiMagnify } from '@mdi/js';
  import { Route } from '$lib/route';
  import { t } from 'svelte-i18n';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';

  interface Props {
    spaceId: string;
    showSearchResults?: boolean;
    onSearchStateChange?: (showing: boolean) => void;
  }

  let { spaceId, showSearchResults = $bindable(false), onSearchStateChange }: Props = $props();

  let searchQuery = $state('');
  let searchResults = $state<AssetResponseDto[]>([]);
  let isSearching = $state(false);

  export const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      clearSearch();
      return;
    }

    isSearching = true;
    showSearchResults = true;
    onSearchStateChange?.(true);
    try {
      const { assets } = await searchSmart({
        smartSearchDto: { query, spaceId },
      });
      searchResults = assets.items;
    } catch {
      searchResults = [];
    } finally {
      isSearching = false;
    }
  };

  export const clearSearch = () => {
    searchQuery = '';
    searchResults = [];
    showSearchResults = false;
    onSearchStateChange?.(false);
  };
</script>

<div class="mt-2 flex items-center gap-2">
  <form
    class="relative flex-1"
    onsubmit={(e) => {
      e.preventDefault();
      void handleSearch();
    }}
  >
    <input
      type="text"
      bind:value={searchQuery}
      placeholder={$t('search')}
      class="w-full rounded-lg border bg-transparent px-10 py-2 text-sm dark:border-gray-600 focus:border-immich-primary focus:outline-none"
    />
    <button type="submit" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
      <Icon icon={mdiMagnify} size="18" />
    </button>
    {#if searchQuery}
      <button
        type="button"
        onclick={clearSearch}
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <Icon icon={mdiClose} size="18" />
      </button>
    {/if}
  </form>
</div>

{#if showSearchResults}
  <section class="py-4">
    {#if isSearching}
      <div class="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    {:else if searchResults.length === 0}
      <p class="mt-8 text-center text-gray-500 dark:text-gray-400">{$t('search_no_result')}</p>
    {:else}
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {searchResults.length} results
      </p>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-1">
        {#each searchResults as asset (asset.id)}
          <a
            href="{Route.viewSpace({ id: spaceId })}/photos/{asset.id}"
            class="aspect-square cursor-pointer overflow-hidden rounded"
          >
            <img
              src="/api/assets/{asset.id}/thumbnail"
              alt={asset.originalFileName}
              class="h-full w-full object-cover"
            />
          </a>
        {/each}
      </div>
    {/if}
  </section>
{/if}
