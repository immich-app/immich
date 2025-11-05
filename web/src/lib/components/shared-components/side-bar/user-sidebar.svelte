<script lang="ts">
  import { resolve } from '$app/paths';
  import BottomInfo from '$lib/components/shared-components/side-bar/bottom-info.svelte';
  import RecentAlbums from '$lib/components/shared-components/side-bar/recent-albums.svelte';
  import Sidebar from '$lib/components/sidebar/sidebar.svelte';
  import { recentAlbumsDropdown } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { preferences } from '$lib/stores/user.store';
  import {
    mdiAccount,
    mdiAccountMultiple,
    mdiAccountMultipleOutline,
    mdiAccountOutline,
    mdiArchiveArrowDown,
    mdiArchiveArrowDownOutline,
    mdiFolderOutline,
    mdiHeart,
    mdiHeartOutline,
    mdiImageAlbum,
    mdiImageMultiple,
    mdiImageMultipleOutline,
    mdiLink,
    mdiLock,
    mdiLockOutline,
    mdiMagnify,
    mdiMap,
    mdiMapOutline,
    mdiTagMultipleOutline,
    mdiToolbox,
    mdiToolboxOutline,
    mdiTrashCan,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';
  import SideBarLink from './side-bar-link.svelte';

  let isArchiveSelected: boolean = $state(false);
  let isFavoritesSelected: boolean = $state(false);
  let isMapSelected: boolean = $state(false);
  let isPeopleSelected: boolean = $state(false);
  let isPhotosSelected: boolean = $state(false);
  let isSharingSelected: boolean = $state(false);
  let isTrashSelected: boolean = $state(false);
  let isUtilitiesSelected: boolean = $state(false);
  let isLockedFolderSelected: boolean = $state(false);
</script>

<Sidebar ariaLabel={$t('primary')}>
  <SideBarLink
    title={$t('photos')}
    href={resolve('/(user)/photos')}
    bind:isSelected={isPhotosSelected}
    icon={isPhotosSelected ? mdiImageMultiple : mdiImageMultipleOutline}
  ></SideBarLink>

  {#if $featureFlags.search}
    <SideBarLink title={$t('explore')} href={resolve('/(user)/explore')} icon={mdiMagnify} />
  {/if}

  {#if $featureFlags.map}
    <SideBarLink
      title={$t('map')}
      href={resolve('/(user)/map')}
      bind:isSelected={isMapSelected}
      icon={isMapSelected ? mdiMap : mdiMapOutline}
    />
  {/if}

  {#if $preferences.people.enabled && $preferences.people.sidebarWeb}
    <SideBarLink
      title={$t('people')}
      href={resolve('/(user)/people')}
      bind:isSelected={isPeopleSelected}
      icon={isPeopleSelected ? mdiAccount : mdiAccountOutline}
    />
  {/if}

  {#if $preferences.sharedLinks.enabled && $preferences.sharedLinks.sidebarWeb}
    <SideBarLink title={$t('shared_links')} href={resolve('/(user)/shared-links')} icon={mdiLink} />
  {/if}

  <SideBarLink
    title={$t('sharing')}
    href={resolve('/(user)/sharing')}
    icon={isSharingSelected ? mdiAccountMultiple : mdiAccountMultipleOutline}
    bind:isSelected={isSharingSelected}
  ></SideBarLink>

  <p class="text-xs p-6 dark:text-immich-dark-fg uppercase">{$t('library')}</p>

  <SideBarLink
    title={$t('favorites')}
    href={resolve('/(user)/favorites')}
    icon={isFavoritesSelected ? mdiHeart : mdiHeartOutline}
    bind:isSelected={isFavoritesSelected}
  ></SideBarLink>

  <SideBarLink
    title={$t('albums')}
    href={resolve('/(user)/albums')}
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
    <SideBarLink title={$t('tags')} href={resolve('/(user)/tags')} icon={mdiTagMultipleOutline} flippedLogo />
  {/if}

  {#if $preferences.folders.enabled && $preferences.folders.sidebarWeb}
    <SideBarLink title={$t('folders')} href={resolve('/(user)/folders')} icon={mdiFolderOutline} flippedLogo />
  {/if}

  <SideBarLink
    title={$t('utilities')}
    href={resolve('/(user)/utilities')}
    bind:isSelected={isUtilitiesSelected}
    icon={isUtilitiesSelected ? mdiToolbox : mdiToolboxOutline}
  ></SideBarLink>

  <SideBarLink
    title={$t('archive')}
    href={resolve('/(user)/archive')}
    bind:isSelected={isArchiveSelected}
    icon={isArchiveSelected ? mdiArchiveArrowDown : mdiArchiveArrowDownOutline}
  ></SideBarLink>

  <SideBarLink
    title={$t('locked_folder')}
    href={resolve('/(user)/locked')}
    bind:isSelected={isLockedFolderSelected}
    icon={isLockedFolderSelected ? mdiLock : mdiLockOutline}
  ></SideBarLink>

  {#if $featureFlags.trash}
    <SideBarLink
      title={$t('trash')}
      href={resolve('/(user)/trash')}
      bind:isSelected={isTrashSelected}
      icon={isTrashSelected ? mdiTrashCan : mdiTrashCanOutline}
    ></SideBarLink>
  {/if}

  <BottomInfo />
</Sidebar>
