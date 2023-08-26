<script lang="ts">
  import { page } from '$app/stores';
  import { AssetApiGetAssetStatsRequest, api } from '@api';
  import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
  import AccountMultiple from 'svelte-material-icons/AccountMultiple.svelte';
  import ImageAlbum from 'svelte-material-icons/ImageAlbum.svelte';
  import ImageMultipleOutline from 'svelte-material-icons/ImageMultipleOutline.svelte';
  import ImageMultiple from 'svelte-material-icons/ImageMultiple.svelte';
  import ArchiveArrowDownOutline from 'svelte-material-icons/ArchiveArrowDownOutline.svelte';
  import Magnify from 'svelte-material-icons/Magnify.svelte';
  import Map from 'svelte-material-icons/Map.svelte';
  import HeartMultipleOutline from 'svelte-material-icons/HeartMultipleOutline.svelte';
  import HeartMultiple from 'svelte-material-icons/HeartMultiple.svelte';
  import { AppRoute } from '../../../constants';
  import LoadingSpinner from '../loading-spinner.svelte';
  import StatusBox from '../status-box.svelte';
  import SideBarButton from './side-bar-button.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import SideBarSection from './side-bar-section.svelte';
  import { featureFlags } from '$lib/stores/feature-flags.store';

  const getStats = async (dto: AssetApiGetAssetStatsRequest) => {
    const { data: stats } = await api.assetApi.getAssetStats(dto);
    return stats;
  };

  const getAlbumCount = async () => {
    try {
      const { data: albumCount } = await api.albumApi.getAlbumCount();
      return albumCount;
    } catch {
      return { owned: 0, shared: 0, notShared: 0 };
    }
  };

  const isFavoritesSelected = $page.route.id === '/(user)/favorites';
  const isPhotosSelected = $page.route.id === '/(user)/photos';
  const isSharingSelected = $page.route.id === '/(user)/sharing';
</script>

<SideBarSection>
  <a data-sveltekit-preload-data="hover" data-sveltekit-noscroll href={AppRoute.PHOTOS} draggable="false">
    <SideBarButton
      title="Photos"
      logo={isPhotosSelected ? ImageMultiple : ImageMultipleOutline}
      isSelected={isPhotosSelected}
    >
      <svelte:fragment slot="moreInformation">
        {#await getStats({ isArchived: false })}
          <LoadingSpinner />
        {:then data}
          <div>
            <p>{data.videos.toLocaleString($locale)} Videos</p>
            <p>{data.images.toLocaleString($locale)} Photos</p>
          </div>
        {/await}
      </svelte:fragment>
    </SideBarButton>
  </a>
  {#if $featureFlags.search}
    <a data-sveltekit-preload-data="hover" data-sveltekit-noscroll href={AppRoute.EXPLORE} draggable="false">
      <SideBarButton title="Explore" logo={Magnify} isSelected={$page.route.id === '/(user)/explore'} />
    </a>
  {/if}
  <a data-sveltekit-preload-data="hover" href={AppRoute.MAP} draggable="false">
    <SideBarButton title="Map" logo={Map} isSelected={$page.route.id === '/(user)/map'} />
  </a>
  <a data-sveltekit-preload-data="hover" href={AppRoute.SHARING} draggable="false">
    <SideBarButton
      title="Sharing"
      logo={isSharingSelected ? AccountMultiple : AccountMultipleOutline}
      isSelected={isSharingSelected}
    >
      <svelte:fragment slot="moreInformation">
        {#await getAlbumCount()}
          <LoadingSpinner />
        {:then data}
          <div>
            <p>{data.shared.toLocaleString($locale)} Albums</p>
          </div>
        {/await}
      </svelte:fragment>
    </SideBarButton>
  </a>

  <div class="text-xs transition-all duration-200 dark:text-immich-dark-fg">
    <p class="hidden p-6 group-hover:sm:block md:block">LIBRARY</p>
    <hr class="mx-4 mb-[31px] mt-8 block group-hover:sm:hidden md:hidden" />
  </div>
  <a data-sveltekit-preload-data="hover" href={AppRoute.FAVORITES} draggable="false">
    <SideBarButton
      title="Favorites"
      logo={isFavoritesSelected ? HeartMultiple : HeartMultipleOutline}
      isSelected={isFavoritesSelected}
    >
      <svelte:fragment slot="moreInformation">
        {#await getStats({ isFavorite: true })}
          <LoadingSpinner />
        {:then data}
          <div>
            <p>{data.videos.toLocaleString($locale)} Videos</p>
            <p>{data.images.toLocaleString($locale)} Photos</p>
          </div>
        {/await}
      </svelte:fragment>
    </SideBarButton>
  </a>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ALBUMS} draggable="false">
    <SideBarButton title="Albums" logo={ImageAlbum} flippedLogo={true} isSelected={$page.route.id === '/(user)/albums'}>
      <svelte:fragment slot="moreInformation">
        {#await getAlbumCount()}
          <LoadingSpinner />
        {:then data}
          <div>
            <p>{data.owned.toLocaleString($locale)} Albums</p>
          </div>
        {/await}
      </svelte:fragment>
    </SideBarButton>
  </a>
  <a data-sveltekit-preload-data="hover" href={AppRoute.ARCHIVE} draggable="false">
    <SideBarButton title="Archive" logo={ArchiveArrowDownOutline} isSelected={$page.route.id === '/(user)/archive'}>
      <svelte:fragment slot="moreInformation">
        {#await getStats({ isArchived: true })}
          <LoadingSpinner />
        {:then data}
          <div>
            <p>{data.videos.toLocaleString($locale)} Videos</p>
            <p>{data.images.toLocaleString($locale)} Photos</p>
          </div>
        {/await}
      </svelte:fragment>
    </SideBarButton>
  </a>

  <!-- Status Box -->
  <div class="mb-6 mt-auto">
    <StatusBox />
  </div>
</SideBarSection>
