<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import SharedLinkCard from '$lib/components/sharedlinks-page/shared-link-card.svelte';
  import { AppRoute } from '$lib/constants';
  import GroupTab from '$lib/elements/GroupTab.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import { getAllSharedLinks, SharedLinkType, type SharedLinkResponseDto } from '@immich/sdk';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  let sharedLinks: SharedLinkResponseDto[] = $state([]);
  let sharedLink = $derived(sharedLinks.find(({ id }) => id === page.params.id));

  const refresh = async () => {
    sharedLinks = await getAllSharedLinks({});
  };

  const onDelete = ({ id }: SharedLinkResponseDto) => {
    sharedLinks = sharedLinks.filter((sharedLink) => sharedLink.id !== id);
  };

  onMount(async () => {
    await refresh();
    eventManager.on('sharedLink.delete', onDelete);
  });

  onDestroy(() => {
    return () => eventManager.off('sharedLink.delete', onDelete);
  });

  const handleEditDone = async (updatedLink?: SharedLinkResponseDto) => {
    if (updatedLink) {
      const index = sharedLinks.findIndex((link) => link.id === updatedLink.id);
      if (index !== -1) {
        sharedLinks[index] = updatedLink;
      }
    } else {
      await refresh();
    }
    await goto(AppRoute.SHARED_LINKS);
  };

  type Filter = 'all' | 'album' | 'individual';

  const filterMap: Record<Filter, string> = {
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
  const handleSelectTab = async (value: string) => {
    await goto(`${AppRoute.SHARED_LINKS}?filter=${value}`);
  };

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
    <div class="hidden xl:block h-10">
      <GroupTab label={$t('show_shared_links')} {filters} {labels} selected={selectedTab} onSelect={handleSelectTab} />
    </div>
  {/snippet}

  <div class="w-full max-w-3xl m-auto">
    {#if sharedLinks.length === 0}
      <div
        class="flex place-content-center place-items-center rounded-lg bg-gray-100 dark:bg-immich-dark-gray dark:text-immich-gray p-12"
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

    {#if sharedLink}
      <SharedLinkCreateModal editingLink={sharedLink} onClose={handleEditDone} />
    {/if}
  </div>
</UserPageLayout>
