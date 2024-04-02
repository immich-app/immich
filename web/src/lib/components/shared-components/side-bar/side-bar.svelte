<script lang="ts">
  import { locale, sidebarSettings } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { getAlbumCount, getAssetStatistics } from '@immich/sdk';
  import {
    mdiAccount,
    mdiAccountMultiple,
    mdiAccountMultipleOutline,
    mdiArchiveArrowDownOutline,
    mdiHeartMultiple,
    mdiHeartMultipleOutline,
    mdiImageAlbum,
    mdiImageMultiple,
    mdiImageMultipleOutline,
    mdiMagnify,
    mdiMap,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import LoadingSpinner from '../loading-spinner.svelte';
  import StatusBox from '../status-box.svelte';
  import SideBarSection from './side-bar-section.svelte';
  import SideBarLink from './side-bar-link.svelte';

  const getStats = (dto: Parameters<typeof getAssetStatistics>[0]) => getAssetStatistics(dto);

  const handleAlbumCount = async () => {
    try {
      return await getAlbumCount();
    } catch {
      return { owned: 0, shared: 0, notShared: 0 };
    }
  };

  let isFavoritesSelected: boolean;
  let isPhotosSelected: boolean;
  let isSharingSelected: boolean;
</script>

<SideBarSection>
  <nav aria-label="Primary">
    <SideBarLink
      title="Photos"
      routeId="/(user)/photos"
      bind:isSelected={isPhotosSelected}
      icon={isPhotosSelected ? mdiImageMultiple : mdiImageMultipleOutline}
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
    </SideBarLink>
    {#if $featureFlags.search}
      <SideBarLink title="Explore" routeId="/(user)/explore" icon={mdiMagnify} />
    {/if}

    {#if $featureFlags.map}
      <SideBarLink title="Map" routeId="/(user)/map" icon={mdiMap} />
    {/if}

    {#if $sidebarSettings.people}
      <SideBarLink title="People" routeId="/(user)/people" icon={mdiAccount} />
    {/if}
    {#if $sidebarSettings.sharing}
      <SideBarLink
        title="Sharing"
        routeId="/(user)/sharing"
        icon={isSharingSelected ? mdiAccountMultiple : mdiAccountMultipleOutline}
        bind:isSelected={isSharingSelected}
      >
        <svelte:fragment slot="moreInformation">
          {#await handleAlbumCount()}
            <LoadingSpinner />
          {:then data}
            <div>
              <p>{data.shared.toLocaleString($locale)} Albums</p>
            </div>
          {/await}
        </svelte:fragment>
      </SideBarLink>
    {/if}

    <div class="text-xs transition-all duration-200 dark:text-immich-dark-fg">
      <p class="hidden p-6 group-hover:sm:block md:block">LIBRARY</p>
      <hr class="mx-4 mb-[31px] mt-8 block group-hover:sm:hidden md:hidden" />
    </div>
    <SideBarLink
      title="Favorites"
      routeId="/(user)/favorites"
      icon={isFavoritesSelected ? mdiHeartMultiple : mdiHeartMultipleOutline}
      bind:isSelected={isFavoritesSelected}
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
    </SideBarLink>
    <SideBarLink title="Albums" routeId="/(user)/albums" icon={mdiImageAlbum} flippedLogo>
      <svelte:fragment slot="moreInformation">
        {#await handleAlbumCount()}
          <LoadingSpinner />
        {:then data}
          <div>
            <p>{data.owned.toLocaleString($locale)} Albums</p>
          </div>
        {/await}
      </svelte:fragment>
    </SideBarLink>

    <SideBarLink title="Archive" routeId="/(user)/archive" icon={mdiArchiveArrowDownOutline}>
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
    </SideBarLink>

    <SideBarLink title="Duplicates" routeId="/(user)/duplicates" icon={mdiArchiveArrowDownOutline}>
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
    </SideBarLink>

    {#if $featureFlags.trash}
      <SideBarLink title="Trash" routeId="/(user)/trash" icon={mdiTrashCanOutline}>
        <svelte:fragment slot="moreInformation">
          {#await getStats({ isTrashed: true })}
            <LoadingSpinner />
          {:then data}
            <div>
              <p>{data.videos.toLocaleString($locale)} Videos</p>
              <p>{data.images.toLocaleString($locale)} Photos</p>
            </div>
          {/await}
        </svelte:fragment>
      </SideBarLink>
    {/if}
  </nav>

  <!-- Status Box -->
  <div class="mb-6 mt-auto">
    <StatusBox />
  </div>
</SideBarSection>
