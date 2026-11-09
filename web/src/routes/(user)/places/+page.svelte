<script lang="ts">
  import UserPageLayout from '#lib/components/layouts/UserPageLayout.svelte';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getAssetsByCityQuery } from '#lib/queries/search.query.ts';
  import { locale, placesViewSettings } from '#lib/stores/preferences.store.ts';
  import { type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import PlacesControls from './PlacesControls.svelte';
  import Places from './PlacesList.svelte';

  const query = createPreloadedQuery(getAssetsByCityQuery);
  const items = $derived(query.data);

  type AssetWithCity = AssetResponseDto & {
    exifInfo: {
      city: string;
    };
  };

  let searchQuery = $state('');
  let searchResultCount = $state(0);
  let placesGroups: string[] = $state([]);

  let places = $derived(items.filter((item): item is AssetWithCity => !!item.exifInfo?.city));
  let countVisiblePlaces = $derived(searchQuery ? searchResultCount : places.length);

  let innerHeight: number = $state(0);
</script>

<svelte:window bind:innerHeight />

<UserPageLayout
  title={$t('places')}
  description={countVisiblePlaces === 0 && !searchQuery ? undefined : `(${countVisiblePlaces.toLocaleString($locale)})`}
>
  {#snippet buttons()}
    <div class="flex place-items-center gap-2">
      <PlacesControls {placesGroups} bind:searchQuery />
    </div>
  {/snippet}

  <Places
    {places}
    userSettings={$placesViewSettings}
    {searchQuery}
    bind:searchResultCount
    bind:placesGroupIds={placesGroups}
  />
</UserPageLayout>
