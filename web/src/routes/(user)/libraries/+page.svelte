<script lang="ts">
  import { LibraryViewSettings } from '$lib/stores/preferences.store';
  import LibraryCard from '$lib/components/Library-page/Library-card.svelte';
  import { goto } from '$app/navigation';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
  import type { PageData } from './$types';
  import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
  import { useLibraries } from './Libraries.bloc';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import type { LibraryResponseDto } from '@api';

  export let data: PageData;

  const sortByOptions = ['Most recent photo', 'Last modified', 'Library title'];

  const {
    Libraries: unsortedLibraries,
    isShowContextMenu,
    contextMenuPosition,
    contextMenuTargetLibrary,
    createLibrary,
    deleteLibrary,
    showLibraryContextMenu,
    closeLibraryContextMenu,
  } = useLibraries({ Libraries: data.Libraries });

  let Libraries = unsortedLibraries;
  let LibraryToDelete: LibraryResponseDto | null;

  const setLibraryToDelete = () => {
    LibraryToDelete = $contextMenuTargetLibrary ?? null;
    closeLibraryContextMenu();
  };

  const deleteSelectedLibrary = async () => {
    if (!LibraryToDelete) {
      return;
    }
    try {
      await deleteLibrary(LibraryToDelete);
    } catch {
      notificationController.show({
        message: 'Error deleting Library',
        type: NotificationType.Error,
      });
    } finally {
      LibraryToDelete = null;
    }
  };

  const sortByDate = (a: string, b: string) => {
    const aDate = new Date(a);
    const bDate = new Date(b);
    return bDate.getTime() - aDate.getTime();
  };

  $: {
    const { sortBy } = $LibraryViewSettings;
    if (sortBy === 'Most recent photo') {
      $Libraries = $unsortedLibraries.sort((a, b) =>
        a.lastModifiedAssetTimestamp && b.lastModifiedAssetTimestamp
          ? sortByDate(a.lastModifiedAssetTimestamp, b.lastModifiedAssetTimestamp)
          : sortByDate(a.updatedAt, b.updatedAt),
      );
    } else if (sortBy === 'Last modified') {
      $Libraries = $unsortedLibraries.sort((a, b) => sortByDate(a.updatedAt, b.updatedAt));
    } else if (sortBy === 'Library title') {
      $Libraries = $unsortedLibraries.sort((a, b) => a.LibraryName.localeCompare(b.LibraryName));
    }
  }

  const handleCreateLibrary = async () => {
    const newLibrary = await createLibrary();
    if (newLibrary) {
      goto('/Libraries/' + newLibrary.id);
    }
  };

  onMount(() => {
    removeLibrariesIfEmpty();
  });

  const removeLibrariesIfEmpty = async () => {
    try {
      for (const Library of $Libraries) {
        if (Library.assetCount == 0 && Library.LibraryName == 'Untitled') {
          await deleteLibrary(Library);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
  <div class="flex place-items-center gap-2" slot="buttons">
    <LinkButton on:click={handleCreateLibrary}>
      <div class="flex place-items-center gap-2 text-sm">
        <PlusBoxOutline size="18" />
        Create Library
      </div>
    </LinkButton>

    <Dropdown options={sortByOptions} bind:value={$LibraryViewSettings.sortBy} />
  </div>

  <!-- Library Card -->
  <div class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
    {#each $Libraries as Library (Library.id)}
      <a data-sveltekit-preload-data="hover" href={`Libraries/${Library.id}`} animate:flip={{ duration: 200 }}>
        <LibraryCard
          {Library}
          on:showLibrarycontextmenu={(e) => showLibraryContextMenu(e.detail, Library)}
          user={data.user}
        />
      </a>
    {/each}
  </div>

  <!-- Empty Message -->
  {#if $Libraries.length === 0}
    <EmptyPlaceholder
      text="Create an Library to organize your photos and videos"
      actionHandler={handleCreateLibrary}
      alt="Empty Libraries"
    />
  {/if}
</UserPageLayout>

<!-- Context Menu -->
{#if $isShowContextMenu}
  <ContextMenu {...$contextMenuPosition} on:outclick={closeLibraryContextMenu}>
    <MenuOption on:click={() => setLibraryToDelete()}>
      <span class="flex place-items-center place-content-center gap-2">
        <DeleteOutline size="18" />
        <p>Delete Library</p>
      </span>
    </MenuOption>
  </ContextMenu>
{/if}

{#if LibraryToDelete}
  <ConfirmDialogue
    title="Delete Library"
    confirmText="Delete"
    on:confirm={deleteSelectedLibrary}
    on:cancel={() => (LibraryToDelete = null)}
  >
    <svelte:fragment slot="prompt">
      <p>Are you sure you want to delete the Library <b>{LibraryToDelete.LibraryName}</b>?</p>
      <p>If this Library is shared, other users will not be able to access it anymore.</p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
