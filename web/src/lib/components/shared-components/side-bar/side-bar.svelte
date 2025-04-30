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
    mdiLink,
  } from '@mdi/js';
  import SideBarSection from './side-bar-section.svelte';
  import SideBarLink from './side-bar-link.svelte';
  import { t } from 'svelte-i18n';
  import BottomInfo from '$lib/components/shared-components/side-bar/bottom-info.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { recentAlbumsDropdown } from '$lib/stores/preferences.store';
  import RecentAlbums from '$lib/components/shared-components/side-bar/recent-albums.svelte';
  import { fly } from 'svelte/transition';

  let isArchiveSelected: boolean = $state(false);
  let isFavoritesSelected: boolean = $state(false);
  let isMapSelected: boolean = $state(false);
  let isPeopleSelected: boolean = $state(false);
  let isPhotosSelected: boolean = $state(false);
  let isSharingSelected: boolean = $state(false);
  let isTrashSelected: boolean = $state(false);
  let isUtilitiesSelected: boolean = $state(false);
</script>

<SideBarSection ariaLabel={$t('primary')}>
  <SideBarLink
    title={$t('photos')}
    routeId="/(user)/photos"
    bind:isSelected={isPhotosSelected}
    icon={isPhotosSelected ? mdiImageMultiple : mdiImageMultipleOutline}
  ></SideBarLink>

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

  {#if $preferences.sharedLinks.enabled && $preferences.sharedLinks.sidebarWeb}
    <SideBarLink title={$t('shared_links')} routeId="/(user)/shared-links" icon={mdiLink} />
  {/if}

  <SideBarLink
    title={$t('sharing')}
    routeId="/(user)/sharing"
    icon={isSharingSelected ? mdiAccountMultiple : mdiAccountMultipleOutline}
    bind:isSelected={isSharingSelected}
  ></SideBarLink>

  <p class="text-xs p-6 dark:text-immich-dark-fg">{$t('library').toUpperCase()}</p>

  <SideBarLink
    title={$t('favorites')}
    routeId="/(user)/favorites"
    icon={isFavoritesSelected ? mdiHeart : mdiHeartOutline}
    bind:isSelected={isFavoritesSelected}
  ></SideBarLink>

  <SideBarLink
    title={$t('albums')}
    routeId="/(user)/albums"
    icon={mdiImageAlbum}
    flippedLogo
    bind:dropdownOpen={$recentAlbumsDropdown}
  >
    {#snippet dropDownContent()}
      <span in:fly={{ y: -20 }} class="hidden md:block">
        <RecentAlbums />
      </span>
    {/snippet}
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
  ></SideBarLink>

  {#if $featureFlags.trash}
    <SideBarLink
      title={$t('trash')}
      routeId="/(user)/trash"
      bind:isSelected={isTrashSelected}
      icon={isTrashSelected ? mdiTrashCan : mdiTrashCanOutline}
    ></SideBarLink>
  {/if}

  <BottomInfo />
</SideBarSection>
