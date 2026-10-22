<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import SharedLinkCard from './SharedLinkCard.svelte';
  import { type SharedLinkTab } from '$lib/constants';
  import GroupTab from '$lib/elements/GroupTab.svelte';
  import { Route } from '$lib/route';
  import { createPreloadedQuery } from '$lib/queries/client';
  import { getAllSharedLinksQuery } from '$lib/queries/shared-link.query';
  import { SharedLinkType } from '@immich/sdk';
  import { Container } from '@immich/ui';
  import { type Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { LayoutData } from './$types';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  const { children, data }: Props = $props();

  const query = createPreloadedQuery(getAllSharedLinksQuery);
  const sharedLinks = $derived(query.data);

  const filterMap: Record<SharedLinkTab, string> = {
    all: $t('all'),
    album: $t('albums'),
    individual: $t('individual_shares'),
  };

  let filters = Object.keys(filterMap);
  let labels = Object.values(filterMap);

  const getActiveTab = (url: URL) => {
    const filter = url.searchParams.get('filter');
    return filter && filters.includes(filter) ? filter : 'all';
  };

  let selectedTab = $derived(getActiveTab(page.url));

  let filteredSharedLinks = $derived(
    sharedLinks.filter(
      ({ type }) =>
        selectedTab === 'all' ||
        (type === SharedLinkType.Album && selectedTab === 'album') ||
        (type === SharedLinkType.Individual && selectedTab === 'individual'),
    ),
  );
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <div class="hidden h-10 xl:block">
      <GroupTab
        label={$t('show_shared_links')}
        {filters}
        {labels}
        selected={selectedTab}
        onSelect={(value) => goto(Route.sharedLinks({ filter: value as SharedLinkTab }))}
      />
    </div>
  {/snippet}

  <Container center size="medium">
    {#if sharedLinks.length === 0}
      <div
        class="flex place-content-center place-items-center rounded-lg bg-gray-100 p-12 dark:bg-immich-dark-gray dark:text-immich-gray"
      >
        <p>{$t('you_dont_have_any_shared_links')}</p>
      </div>
    {:else}
      <div class="flex flex-col gap-2">
        {#each filteredSharedLinks as sharedLink (sharedLink.id)}
          <SharedLinkCard {sharedLink} />
        {/each}
      </div>
    {/if}

    {@render children?.()}
  </Container>
</UserPageLayout>
