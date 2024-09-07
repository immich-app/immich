<script lang="ts">
  import { featureFlags } from '$lib/stores/server-config.store';
  import {
    mdiAccount,
    mdiAccountOutline,
    mdiAccountMultiple,
    mdiAccountMultipleOutline,
    mdiArchiveArrowDown,
    mdiArchiveArrowDownOutline,
    mdiHeart,
    mdiHeartOutline,
    mdiImageAlbum,
    mdiImageMultiple,
    mdiImageMultipleOutline,
    mdiMagnify,
    mdiMap,
    mdiMapOutline,
    mdiTrashCan,
    mdiTrashCanOutline,
    mdiToolbox,
    mdiToolboxOutline,
    mdiFolderOutline,
    mdiTagMultipleOutline,
  } from '@mdi/js';
  import SideBarSection from './side-bar-section.svelte';
  import SideBarLink from './side-bar-link.svelte';
  import MoreInformationAssets from '$lib/components/shared-components/side-bar/more-information-assets.svelte';
  import MoreInformationAlbums from '$lib/components/shared-components/side-bar/more-information-albums.svelte';
  import { t } from 'svelte-i18n';
  import BottomInfo from '$lib/components/shared-components/side-bar/bottom-info.svelte';
  import { preferences } from '$lib/stores/user.store';

  let isArchiveSelected: boolean;
  let isFavoritesSelected: boolean;
  let isMapSelected: boolean;
  let isPeopleSelected: boolean;
  let isPhotosSelected: boolean;
  let isSharingSelected: boolean;
  let isTrashSelected: boolean;
  let isUtilitiesSelected: boolean;
</script>

<SideBarSection>
  <nav aria-label={$t('primary')}>
    <SideBarLink
      title={$t('photos')}
      routeId="/(user)/photos"
      bind:isSelected={isPhotosSelected}
      icon={isPhotosSelected ? mdiImageMultiple : mdiImageMultipleOutline}
    >
      <svelte:fragment slot="moreInformation">
        <MoreInformationAssets assetStats={{ isArchived: false }} />
      </svelte:fragment>
    </SideBarLink>

    {#if $featureFlags.search}
      <SideBarLink title={$t('explore')} routeId="/(user)/explore" icon={mdiMagnify} />
    {/if}

    {#if $featureFlags.map}
      <SideBarLink
        title={$t('map')}
        routeId="/(user)/map"
        bind:isSelected={isMapSelected}
        icon={isMapSelected ? mdiMap : mdiMapOutline}
      />
    {/if}

    {#if $preferences.people.enabled && $preferences.people.sidebarWeb}
      <SideBarLink
        title={$t('people')}
        routeId="/(user)/people"
        bind:isSelected={isPeopleSelected}
        icon={isPeopleSelected ? mdiAccount : mdiAccountOutline}
      />
    {/if}

    <SideBarLink
      title={$t('sharing')}
      routeId="/(user)/sharing"
      icon={isSharingSelected ? mdiAccountMultiple : mdiAccountMultipleOutline}
      bind:isSelected={isSharingSelected}
    >
      <svelte:fragment slot="moreInformation">
        <MoreInformationAlbums albumType="shared" />
      </svelte:fragment>
    </SideBarLink>

    <div class="text-xs transition-all duration-200 dark:text-immich-dark-fg">
      <p class="hidden p-6 group-hover:sm:block md:block">{$t('library').toUpperCase()}</p>
      <hr class="mx-4 mb-[31px] mt-8 block group-hover:sm:hidden md:hidden" />
    </div>

    <SideBarLink
      title={$t('favorites')}
      routeId="/(user)/favorites"
      icon={isFavoritesSelected ? mdiHeart : mdiHeartOutline}
      bind:isSelected={isFavoritesSelected}
    >
      <svelte:fragment slot="moreInformation">
        <MoreInformationAssets assetStats={{ isFavorite: true }} />
      </svelte:fragment>
    </SideBarLink>

    <SideBarLink title={$t('albums')} routeId="/(user)/albums" icon={mdiImageAlbum} flippedLogo>
      <svelte:fragment slot="moreInformation">
        <MoreInformationAlbums albumType="owned" />
      </svelte:fragment>
    </SideBarLink>

    {#if $preferences.tags.enabled && $preferences.tags.sidebarWeb}
      <SideBarLink title={$t('tags')} routeId="/(user)/tags" icon={mdiTagMultipleOutline} flippedLogo />
    {/if}

    {#if $preferences.folders.enabled && $preferences.folders.sidebarWeb}
      <SideBarLink title={$t('folders')} routeId="/(user)/folders" icon={mdiFolderOutline} flippedLogo />
    {/if}

    <SideBarLink
      title={$t('utilities')}
      routeId="/(user)/utilities"
      bind:isSelected={isUtilitiesSelected}
      icon={isUtilitiesSelected ? mdiToolbox : mdiToolboxOutline}
    ></SideBarLink>

    <SideBarLink
      title={$t('archive')}
      routeId="/(user)/archive"
      bind:isSelected={isArchiveSelected}
      icon={isArchiveSelected ? mdiArchiveArrowDown : mdiArchiveArrowDownOutline}
    >
      <svelte:fragment slot="moreInformation">
        <MoreInformationAssets assetStats={{ isArchived: true }} />
      </svelte:fragment>
    </SideBarLink>

    {#if $featureFlags.trash}
      <SideBarLink
        title={$t('trash')}
        routeId="/(user)/trash"
        bind:isSelected={isTrashSelected}
        icon={isTrashSelected ? mdiTrashCan : mdiTrashCanOutline}
      >
        <svelte:fragment slot="moreInformation">
          <MoreInformationAssets assetStats={{ isTrashed: true }} />
        </svelte:fragment>
      </SideBarLink>
    {/if}
  </nav>

  <BottomInfo />
</SideBarSection>
