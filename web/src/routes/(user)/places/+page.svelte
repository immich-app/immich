<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import PlacesControls from '$lib/components/places-page/places-controls.svelte';
  import type { PageData } from './$types';
  import { type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { locale } from '$lib/stores/preferences.store';
  import Places from '$lib/components/places-page/places-list.svelte';
  import { placesViewSettings } from '$lib/stores/preferences.store';

  export let data: PageData;

  type AssetWithCity = AssetResponseDto & {
    exifInfo: {
      city: string;
    };
  };

  $: places = data.items.filter((item): item is AssetWithCity => !!item.exifInfo?.city);

  let searchQuery = '';
  let searchResultCount = 0;
  let placesGroups: string[] = [];

  $: countVisiblePlaces = searchQuery ? searchResultCount : places.length;

  let innerHeight: number;
</script>

<svelte:window bind:innerHeight />

<UserPageLayout
  title={$t('places')}
  description={countVisiblePlaces === 0 && !searchQuery ? undefined : `(${countVisiblePlaces.toLocaleString($locale)})`}
>
  <div class="flex place-items-center gap-2" slot="buttons">
    <PlacesControls {placesGroups} bind:searchQuery />
  </div>

  <Places
    {places}
    userSettings={$placesViewSettings}
    {searchQuery}
    bind:searchResultCount
    bind:placesGroupIds={placesGroups}
  />
</UserPageLayout>
