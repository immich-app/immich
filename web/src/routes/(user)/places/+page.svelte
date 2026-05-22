<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import PlacesControls from '$lib/components/places-page/places-controls.svelte';
  import type { PageData } from './$types';
  import { type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { locale } from '$lib/stores/preferences.store';
  import Places from '$lib/components/places-page/places-list.svelte';
  import { placesViewSettings } from '$lib/stores/preferences.store';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  type AssetWithCity = AssetResponseDto & {
    exifInfo: {
      city: string;
    };
  };

  let searchQuery = $state('');
  let searchResultCount = $state(0);
  let placesGroups: string[] = $state([]);

  let places = $derived(data.items.filter((item): item is AssetWithCity => !!item.exifInfo?.city));
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
