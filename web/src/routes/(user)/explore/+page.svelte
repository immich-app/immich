<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import PersonIndicator from '$lib/components/faces-page/PersonIndicator.svelte';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import SingleGridRow from '$lib/components/shared-components/SingleGridRow.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { Route } from '$lib/route';
  import { getAssetMediaUrl, getPeopleThumbnailUrl, handlePromiseError, memoryLaneTitle } from '$lib/utils';
  import { getAssetInfo, AssetMediaSize, MemorySearchOrder, type SearchExploreResponseDto } from '@immich/sdk';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { memoryManager } from '$lib/managers/memory-manager.svelte';
  import MemoryCard from '$lib/components/memories/MemoryCard.svelte';
  import { ImageCarousel } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import Portal from '$lib/elements/Portal.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { fade } from 'svelte/transition';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const getFieldItems = (items: SearchExploreResponseDto[], field: string) => {
    const targetField = items.find((item) => item.fieldName === field);
    return targetField?.items || [];
  };

  let places = $derived(getFieldItems(data.explore, 'exifInfo.city'));
  let recents = $derived(
    getFieldItems(data.explore, 'createdAt').sort((a, b) => new Date(b.value).getTime() - new Date(a.value).getTime()),
  );

  // Because the memory viewer previous/next button uses the memoryManager's list
  // We call it here to ensure the memoryManager has applied the user's preferences before rendering memories.
  handlePromiseError(memoryManager.applyPreferences());

  let memories = $derived(
    data.memories.map((memory) => ({
      id: memory.id,
      title: $memoryLaneTitle(memory),
      href: Route.viewMemory({ id: memory.id, assetId: memory.assets[0].id }),
      alt: $t('memory_lane_title', { values: { title: $getAltText(toTimelineAsset(memory.assets[0])) } }),
      src: getAssetMediaUrl({ id: memory.assets[0].id }),
      type: memory.type,
    })),
  );

  let needFadeInTransition = $state(false);
  const markNeedFadeInTrasition = () => {
    const timer = setTimeout(() => (needFadeInTransition = true), 50);
    return () => clearTimeout(timer);
  };

  const thumbnailUpdatedAt = new SvelteMap<string, string>();
  const onPersonThumbnailReady = ({ id }: { id: string }) => {
    thumbnailUpdatedAt.set(id, new Date().toISOString());
  };

  const onViewAsset = async (id: string) => {
    const asset = await getAssetInfo({ ...authManager.params, id });
    assetViewerManager.setAsset(asset);
  };

  const assetCursor = $derived({
    current: assetViewerManager.asset!,
  });
</script>

<OnEvents {onPersonThumbnailReady} />

{#snippet peopleHeader()}
  <div class="flex justify-between">
    <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('people')}</p>
    <a
      href={Route.people()}
      class="pe-4 text-sm font-medium hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
      draggable="false">{$t('view_all')}</a
    >
  </div>
{/snippet}

<UserPageLayout title={data.meta.title}>
  {#await data.peoplePromise}
    <div class="mt-2 mb-6" aria-busy="true" {@attach markNeedFadeInTrasition}>
      {@render peopleHeader()}
      <SingleGridRow class="grid grid-flow-col grid-auto-fill-20 gap-x-4 md:grid-auto-fill-28">
        {#snippet children({ itemCount })}
          {#each { length: itemCount }, index (index)}
            <div class="animate-pulse">
              <div class="aspect-square w-full rounded-full bg-subtle"></div>
              <div class="mx-auto mt-2.5 mb-0.5 h-4 w-2/3 rounded-sm bg-subtle"></div>
            </div>
          {/each}
        {/snippet}
      </SingleGridRow>
    </div>
  {:then { people, total }}
    {#if total > 0}
      <div class="mt-2 mb-6">
        {@render peopleHeader()}
        <SingleGridRow class="grid grid-flow-col grid-auto-fill-20 gap-x-4 md:grid-auto-fill-28">
          {#snippet children({ itemCount })}
            {#each people.slice(0, itemCount) as person (person.id)}
              <a
                href={Route.viewPerson(person)}
                class="text-center"
                in:fade={{ duration: needFadeInTransition ? 250 : 0 }}
              >
                <div class="@container relative">
                  <ImageThumbnail
                    circle
                    shadow
                    url={getPeopleThumbnailUrl(person, thumbnailUpdatedAt.get(person.id))}
                    altText={person.name}
                    widthStyle="100%"
                  />
                  <PersonIndicator {person} />
                </div>
                <p class="mt-2 text-sm font-medium text-ellipsis dark:text-white">{person.name}</p>
              </a>
            {/each}
          {/snippet}
        </SingleGridRow>
      </div>
    {/if}
  {/await}

  {#if places.length > 0}
    <div class="mt-2 mb-6">
      <div class="flex justify-between">
        <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('places')}</p>
        <a
          href={Route.places()}
          class="pe-4 text-sm font-medium hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
          draggable="false">{$t('view_all')}</a
        >
      </div>
      <SingleGridRow class="grid grid-flow-col grid-auto-fill-28 gap-x-4 md:grid-auto-fill-36">
        {#snippet children({ itemCount })}
          {#each places.slice(0, itemCount) as item (item.data.id)}
            <a class="relative" href={Route.search({ city: item.value })} draggable="false">
              <div class="flex justify-center overflow-hidden rounded-xl brightness-75 filter">
                <img
                  src={getAssetMediaUrl({ id: item.data.id, size: AssetMediaSize.Thumbnail })}
                  alt={item.value}
                  class="aspect-square w-full object-cover"
                />
              </div>
              <span
                class="absolute bottom-2 w-full px-1 text-center text-sm font-medium text-ellipsis text-white capitalize backdrop-blur-[1px] hover:cursor-pointer"
              >
                {item.value}
              </span>
            </a>
          {/each}
        {/snippet}
      </SingleGridRow>
    </div>
  {/if}

  {#if memories.length > 0}
    <div class="mt-2 mb-6">
      <div class="flex justify-between">
        <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('memories')}</p>
        <a
          href={Route.memories()}
          class="pe-4 text-sm font-medium hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
          draggable="false">{$t('view_all')}</a
        >
      </div>
      <ImageCarousel items={memories}>
        {#snippet child(item)}
          <MemoryCard {item} />
        {/snippet}
      </ImageCarousel>
    </div>
  {/if}

  {#if recents.length > 0}
    <div class="mt-2 mb-6">
      <div class="flex justify-between">
        <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('recently_added')}</p>
        <a
          href={Route.recentlyAdded()}
          class="pe-4 text-sm font-medium hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
          draggable="false">{$t('view_all')}</a
        >
      </div>
      <div class="flex h-24 max-w-fit flex-wrap gap-x-1 overflow-hidden md:h-42">
        {#each recents as item (item.data.id)}
          <button
            type="button"
            class="relative h-full flex-auto"
            onclick={() => onViewAsset(item.data.id)}
            draggable="false"
          >
            <img
              src={getAssetMediaUrl({ id: item.data.id, size: AssetMediaSize.Thumbnail })}
              alt={$getAltText(toTimelineAsset(item.data))}
              class="size-full min-w-max rounded-xl object-cover"
            />
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if places.length === 0 && recents.length === 0}
    {#await data.peoplePromise then { total }}
      {#if total === 0}
        <EmptyPlaceholder text={$t('no_explore_results_message')} class="mx-auto mt-10" />
      {/if}
    {/await}
  {/if}
</UserPageLayout>

{#if assetViewerManager.isViewing}
  {#await import('$lib/components/asset-viewer/AssetViewer.svelte') then { default: AssetViewer }}
    <Portal target="body">
      <AssetViewer
        cursor={assetCursor}
        showNavigation={false}
        onClose={() => assetViewerManager.showAssetViewer(false)}
      />
    </Portal>
  {/await}
{/if}
