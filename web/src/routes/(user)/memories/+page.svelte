<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import GroupTab from '$lib/elements/GroupTab.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { handleError } from '$lib/utils/handle-error';
  import { searchMemories, type MemoryResponseDto } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import MemoryCard from './memory-card.svelte';
  import {
    buildMemoryIndexItems,
    filterMemoryIndexItems,
    groupMemoryIndexItems,
    type MemoryIndexFilter,
  } from './memory-index-utils';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const filters: MemoryIndexFilter[] = ['all', 'saved'];

  let memories = $state<MemoryResponseDto[]>([]);
  let isLoading = $state(true);
  let hasError = $state(false);
  let searchQuery = $state('');
  let filter = $state<MemoryIndexFilter>('all');

  const items = $derived(buildMemoryIndexItems(memories, { translate: $t, locale: $locale }));
  const filteredItems = $derived(filterMemoryIndexItems(items, { query: searchQuery, filter }));
  const groups = $derived(groupMemoryIndexItems(filteredItems, { locale: $locale }));
  const labels = $derived([$t('memory_filter_all'), $t('memory_filter_saved')]);

  onMount(() => {
    const loadMemories = async () => {
      try {
        memories = await searchMemories({});
      } catch (error) {
        hasError = true;
        handleError(error, $t('memories_error'));
      } finally {
        isLoading = false;
      }
    };

    void loadMemories();
  });
</script>

<UserPageLayout title={data.meta.title}>
  {#if isLoading}
    <div class="flex min-h-80 items-center justify-center">
      <LoadingSpinner size="large" />
    </div>
  {:else if hasError}
    <EmptyPlaceholder text={$t('memories_error')} fullWidth class="mx-auto mt-10 max-w-xl" />
  {:else if memories.length === 0}
    <EmptyPlaceholder text={$t('memories_empty')} fullWidth class="mx-auto mt-10 max-w-xl" />
  {:else}
    <div class="relative mb-4 flex flex-wrap items-center justify-end gap-2" data-testid="memories-controls">
      <div class="min-w-0 grow sm:grow-0">
        <div class="w-full sm:w-72">
          <SearchBar
            placeholder={$t('memories_search_placeholder')}
            bind:name={searchQuery}
            showLoadingSpinner={false}
          />
        </div>
      </div>

      <div class="h-10">
        <GroupTab
          label={$t('memories')}
          {filters}
          {labels}
          selected={filter}
          onSelect={(selected) => (filter = selected as MemoryIndexFilter)}
        />
      </div>
    </div>

    {#if filteredItems.length === 0}
      <EmptyPlaceholder text={$t('memories_empty')} fullWidth class="mx-auto mt-10 max-w-xl" />
    {:else}
      <div class="flex flex-col gap-8">
        {#each groups as group (group.key)}
          <section class="space-y-2" aria-labelledby={`memories-${group.key}`}>
            <h2
              id={`memories-${group.key}`}
              class="px-5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              {group.label}
            </h2>

            <div class="grid grid-auto-fill-72 gap-y-4" data-testid="memory-group-grid">
              {#each group.items as item, index (item.memory.id)}
                <MemoryCard {item} preload={group.key === groups[0]?.key && index < 20} />
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  {/if}
</UserPageLayout>
