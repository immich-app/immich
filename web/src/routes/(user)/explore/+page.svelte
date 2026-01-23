<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import SingleGridRow from '$lib/components/shared-components/single-grid-row.svelte';
  import { Route } from '$lib/route';
  import { getAssetMediaUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize, type SearchExploreResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiHeart } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const getFieldItems = (items: SearchExploreResponseDto[], field: string) => {
    const targetField = items.find((item) => item.fieldName === field);
    return targetField?.items || [];
  };

  let places = $derived(getFieldItems(data.items, 'exifInfo.city'));
  let people = $state(data.response.people);

  let hasPeople = $derived(data.response.total > 0);

  const onPersonThumbnailReady = ({ id }: { id: string }) => {
    for (const person of people) {
      if (person.id === id) {
        person.updatedAt = new Date().toISOString();
      }
    }
  };
</script>

<OnEvents {onPersonThumbnailReady} />

<UserPageLayout title={data.meta.title}>
  {#if hasPeople}
    <div class="mb-6 mt-2">
      <div class="flex justify-between">
        <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('people')}</p>
        <a
          href={Route.people()}
          class="pe-4 text-sm font-medium hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
          draggable="false">{$t('view_all')}</a
        >
      </div>
      <SingleGridRow class="grid grid-flow-col md:grid-auto-fill-28 grid-auto-fill-20 gap-x-4">
        {#snippet children({ itemCount })}
          {#each people.slice(0, itemCount) as person (person.id)}
            <a href={Route.viewPerson(person)} class="text-center relative">
              <ImageThumbnail
                circle
                shadow
                url={getPeopleThumbnailUrl(person)}
                altText={person.name}
                widthStyle="100%"
              />
              {#if person.isFavorite}
                <div class="absolute top-2 start-2">
                  <Icon icon={mdiHeart} size="24" class="text-white" />
                </div>
              {/if}
              <p class="mt-2 text-ellipsis text-sm font-medium dark:text-white">{person.name}</p>
            </a>
          {/each}
        {/snippet}
      </SingleGridRow>
    </div>
  {/if}

  {#if places.length > 0}
    <div class="mb-6 mt-2">
      <div class="flex justify-between">
        <p class="mb-4 font-medium dark:text-immich-dark-fg">{$t('places')}</p>
        <a
          href={Route.places()}
          class="pe-4 text-sm font-medium hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
          draggable="false">{$t('view_all')}</a
        >
      </div>
      <SingleGridRow class="grid grid-flow-col md:grid-auto-fill-36 grid-auto-fill-28 gap-x-4">
        {#snippet children({ itemCount })}
          {#each places.slice(0, itemCount) as item (item.data.id)}
            <a class="relative" href={Route.search({ city: item.value })} draggable="false">
              <div class="flex justify-center overflow-hidden rounded-xl brightness-75 filter">
                <img
                  src={getAssetMediaUrl({ id: item.data.id, size: AssetMediaSize.Thumbnail })}
                  alt={item.value}
                  class="object-cover aspect-square w-full"
                />
              </div>
              <span
                class="absolute bottom-2 w-full text-ellipsis px-1 text-center text-sm font-medium capitalize text-white backdrop-blur-[1px] hover:cursor-pointer"
              >
                {item.value}
              </span>
            </a>
          {/each}
        {/snippet}
      </SingleGridRow>
    </div>
  {/if}

  {#if !hasPeople && places.length === 0}
    <EmptyPlaceholder text={$t('no_explore_results_message')} class="mt-10 mx-auto" />
  {/if}
</UserPageLayout>
