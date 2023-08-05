<script lang="ts">
  import { afterNavigate, goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import EditNameInput from '$lib/components/faces-page/edit-name-input.svelte';
  import MergeFaceSelector from '$lib/components/faces-page/merge-face-selector.svelte';
  import MergeSuggestionModal from '$lib/components/faces-page/merge-suggestion-modal.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { AppRoute } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetResponseDto, PersonResponseDto, TimeBucketSize, api } from '@api';
  import { onMount } from 'svelte';
  import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  enum ViewMode {
    VIEW_ASSETS = 'view-assets',
    SELECT_FACE = 'select-face',
    MERGE_FACES = 'merge-faces',
    SUGGEST_MERGE = 'suggest-merge',
  }

  const assetStore = new AssetStore({
    size: TimeBucketSize.Month,
    isArchived: false,
    personId: data.person.id,
  });
  const assetInteractionStore = createAssetInteractionStore();
  const { selectedAssets, isMultiSelectState } = assetInteractionStore;

  let viewMode: ViewMode = ViewMode.VIEW_ASSETS;
  let isEditingName = false;
  let previousRoute: string = AppRoute.EXPLORE;
  let people = data.people.people;
  let personMerge1: PersonResponseDto;
  let personMerge2: PersonResponseDto;

  let personName = '';

  $: isAllArchive = Array.from($selectedAssets).every((asset) => asset.isArchived);
  $: isAllFavorite = Array.from($selectedAssets).every((asset) => asset.isFavorite);

  onMount(() => {
    const action = $page.url.searchParams.get('action');
    if (action == 'merge') {
      viewMode = ViewMode.MERGE_FACES;
    }
  });
  afterNavigate(({ from }) => {
    // Prevent setting previousRoute to the current page.
    if (from && from.route.id !== $page.route.id) {
      previousRoute = from.url.href;
    }
  });

  const handleSelectFeaturePhoto = async (asset: AssetResponseDto) => {
    if (viewMode !== ViewMode.SELECT_FACE) {
      return;
    }

    await api.personApi.updatePerson({ id: data.person.id, personUpdateDto: { featureFaceAssetId: asset.id } });

    // TODO: Replace by Websocket in the future
    notificationController.show({
      message: 'Feature photo updated, refresh page to see changes',
      type: NotificationType.Info,
    });

    assetInteractionStore.clearMultiselect();
    // scroll to top

    viewMode = ViewMode.VIEW_ASSETS;
  };

  const handleMergeSameFace = async (response: [PersonResponseDto, PersonResponseDto]) => {
    const [personToMerge, personToBeMergedIn] = response;
    viewMode = ViewMode.VIEW_ASSETS;
    isEditingName = false;
    try {
      await api.personApi.mergePerson({
        id: personToBeMergedIn.id,
        mergePersonDto: { ids: [personToMerge.id] },
      });
      notificationController.show({
        message: 'Merge faces succesfully',
        type: NotificationType.Info,
      });
      people = people.filter((person: PersonResponseDto) => person.id !== personToMerge.id);
      if (personToBeMergedIn.name != personName && data.person.id === personToBeMergedIn.id) {
        changeName();
        invalidateAll();
        return;
      }
      goto(`${AppRoute.PEOPLE}/${personToBeMergedIn.id}`, { replaceState: true });
    } catch (error) {
      handleError(error, 'Unable to save name');
    }
  };

  const changeName = async () => {
    viewMode = ViewMode.VIEW_ASSETS;
    data.person.name = personName;
    try {
      isEditingName = false;

      const { data: updatedPerson } = await api.personApi.updatePerson({
        id: data.person.id,
        personUpdateDto: { name: personName },
      });

      people = people.map((person: PersonResponseDto) => {
        if (person.id === updatedPerson.id) {
          return updatedPerson;
        }
        return person;
      });

      notificationController.show({
        message: 'Change name succesfully',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to save name');
    }
  };

  const handleCancelEditName = () => {
    if (viewMode === ViewMode.SUGGEST_MERGE) {
      return;
    }

    isEditingName = false;
  };

  const handleNameChange = async (name: string) => {
    personName = name;

    if (data.person.name === personName) {
      return;
    }

    const existingPerson = people.find(
      (person: PersonResponseDto) =>
        person.name.toLowerCase() === personName.toLowerCase() && person.id !== data.person.id && person.name,
    );
    if (existingPerson) {
      personMerge2 = existingPerson;
      personMerge1 = data.person;
      viewMode = ViewMode.SUGGEST_MERGE;
      return;
    }
    changeName();
  };
</script>

{#if viewMode === ViewMode.SUGGEST_MERGE}
  <MergeSuggestionModal
    {personMerge1}
    {personMerge2}
    {people}
    on:close={() => (viewMode = ViewMode.VIEW_ASSETS)}
    on:reject={() => changeName()}
    on:confirm={(event) => handleMergeSameFace(event.detail)}
  />
{/if}

{#if viewMode === ViewMode.MERGE_FACES}
  <MergeFaceSelector person={data.person} on:go-back={() => (viewMode = ViewMode.VIEW_ASSETS)} />
{/if}

<header>
  {#if $isMultiSelectState}
    <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
      <CreateSharedLink />
      <SelectAllAssets {assetStore} {assetInteractionStore} />
      <AssetSelectContextMenu icon={Plus} title="Add">
        <AddToAlbum />
        <AddToAlbum shared />
      </AssetSelectContextMenu>
      <DeleteAssets onAssetDelete={(assetId) => $assetStore.removeAsset(assetId)} />
      <AssetSelectContextMenu icon={DotsVertical} title="Add">
        <DownloadAction menuItem filename="{data.person.name || 'immich'}.zip" />
        <FavoriteAction menuItem removeFavorite={isAllFavorite} />
        <ArchiveAction
          menuItem
          unarchive={isAllArchive}
          onAssetArchive={(asset) => $assetStore.removeAsset(asset.id)}
        />
      </AssetSelectContextMenu>
    </AssetSelectControlBar>
  {:else}
    {#if viewMode === ViewMode.VIEW_ASSETS || viewMode === ViewMode.SUGGEST_MERGE}
      <ControlAppBar showBackButton backIcon={ArrowLeft} on:close-button-click={() => goto(previousRoute)}>
        <svelte:fragment slot="trailing">
          <AssetSelectContextMenu icon={DotsVertical} title="Menu">
            <MenuOption text="Change feature photo" on:click={() => (viewMode = ViewMode.SELECT_FACE)} />
            <MenuOption text="Merge face" on:click={() => (viewMode = ViewMode.MERGE_FACES)} />
          </AssetSelectContextMenu>
        </svelte:fragment>
      </ControlAppBar>
    {/if}

    {#if viewMode === ViewMode.SELECT_FACE}
      <ControlAppBar on:close-button-click={() => (viewMode = ViewMode.VIEW_ASSETS)}>
        <svelte:fragment slot="leading">Select feature photo</svelte:fragment>
      </ControlAppBar>
    {/if}
  {/if}
</header>

<main class="relative h-screen overflow-hidden bg-immich-bg pt-[var(--navbar-height)] dark:bg-immich-dark-bg">
  <AssetGrid
    {assetStore}
    {assetInteractionStore}
    isSelectionMode={viewMode === ViewMode.SELECT_FACE}
    singleSelect={viewMode === ViewMode.SELECT_FACE}
    on:select={({ detail: asset }) => handleSelectFeaturePhoto(asset)}
  >
    {#if viewMode === ViewMode.VIEW_ASSETS || viewMode === ViewMode.SUGGEST_MERGE}
      <!-- Face information block -->
      <section class="flex place-items-center p-4 sm:px-6">
        {#if isEditingName}
          <EditNameInput
            person={data.person}
            on:change={(event) => handleNameChange(event.detail)}
            on:cancel={() => handleCancelEditName()}
          />
        {:else}
          <button on:click={() => (viewMode = ViewMode.VIEW_ASSETS)}>
            <ImageThumbnail
              circle
              shadow
              url={api.getPeopleThumbnailUrl(data.person.id)}
              altText={data.person.name}
              widthStyle="3.375rem"
              heightStyle="3.375rem"
            />
          </button>

          <button
            title="Edit name"
            class="px-4 text-immich-primary dark:text-immich-dark-primary"
            on:click={() => (isEditingName = true)}
          >
            {#if data.person.name}
              <p class="py-2 font-medium">{data.person.name}</p>
            {:else}
              <p class="w-fit font-medium">Add a name</p>
              <p class="text-sm text-gray-500 dark:text-immich-gray">Find them fast by name with search</p>
            {/if}
          </button>
        {/if}
      </section>
    {/if}
  </AssetGrid>
</main>
