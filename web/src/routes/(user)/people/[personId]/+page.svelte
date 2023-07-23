<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import EditNameInput from '$lib/components/faces-page/edit-name-input.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetResponseDto, PersonResponseDto, api } from '@api';
  import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import type { PageData } from './$types';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import SelectAll from 'svelte-material-icons/SelectAll.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import FaceThumbnailSelector from '$lib/components/faces-page/face-thumbnail-selector.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import MergeFaceSelector from '$lib/components/faces-page/merge-face-selector.svelte';
  import { onMount } from 'svelte';
  import ProposeMerge from '$lib/components/faces-page/propose-merge.svelte';

  export let data: PageData;
  let isEditingName = false;
  let showFaceThumbnailSelection = false;
  let showMergeFacePanel = false;
  let previousRoute: string = AppRoute.EXPLORE;
  let selectedAssets: Set<AssetResponseDto> = new Set();
  let showMergeModal = false;
  let people = data.people.people;
  let person1: PersonResponseDto;
  let person2: PersonResponseDto;
  let textEntered = '';
  let peopleDiscovery: PersonResponseDto[] = [];
  let originalPerson = { ...data.person };
  let potentialMergePeople: PersonResponseDto[];

  $: isMultiSelectionMode = selectedAssets.size > 0;
  $: isAllArchive = Array.from(selectedAssets).every((asset) => asset.isArchived);
  $: isAllFavorite = Array.from(selectedAssets).every((asset) => asset.isFavorite);

  $: showAssets = !showMergeFacePanel && !showFaceThumbnailSelection;

  $: {
    if (textEntered != '')
      peopleDiscovery = people
        .filter((person: PersonResponseDto) => person.name.toLowerCase().startsWith(textEntered))
        .slice(0, 12);
  }

  onMount(() => {
    const action = $page.url.searchParams.get('action');
    if (action == 'merge') {
      showMergeFacePanel = true;
    }
  });
  afterNavigate(({ from }) => {
    // Prevent setting previousRoute to the current page.
    if (from && from.route.id !== $page.route.id) {
      previousRoute = from.url.href;
    }
  });

  const onAssetDelete = (assetId: string) => {
    data.assets = data.assets.filter((asset: AssetResponseDto) => asset.id !== assetId);
  };
  const handleSelectAll = () => {
    selectedAssets = new Set(data.assets);
  };

  const handleSelectFeaturePhoto = async (event: CustomEvent) => {
    showFaceThumbnailSelection = false;

    const { selectedAsset }: { selectedAsset: AssetResponseDto | undefined } = event.detail;

    if (selectedAsset) {
      await api.personApi.updatePerson({
        id: data.person.id,
        personUpdateDto: { featureFaceAssetId: selectedAsset.id },
      });

      // TODO: Replace by Websocket in the future
      notificationController.show({
        message: 'Feature photo updated, refresh page to see changes',
        type: NotificationType.Info,
      });
    }
  };

  const handleMergeSameFace = async () => {
    showMergeModal = false;
    try {
      await api.personApi.mergePerson({
        id: person2.id,
        mergePersonDto: { ids: [originalPerson.id] },
      });
      goto(`${AppRoute.PEOPLE}/${person2.id}`);
      notificationController.show({
        message: 'Merge faces succesfully',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to save name');
    }
  };

  const handleNameChange = async (name: string) => {
    for (const person of people) {
      if (person.name === name && person.id !== originalPerson.id) {
        person2 = person;
        break;
      }
    }
    console.log('person2', person2);
    if (person2 === undefined) {
      try {
        isEditingName = false;
        data.person.name = name;
        await api.personApi.updatePerson({ id: data.person.id, personUpdateDto: { name: textEntered } });
      } catch (error) {
        handleError(error, 'Unable to save name');
      }
    } else {
      person1 = data.person;
      potentialMergePeople = people.filter(
        (person: PersonResponseDto) =>
          originalPerson.name === person.name && person.id !== person2.id && person.id !== person1.id,
      );
      console.log(potentialMergePeople);
      showMergeModal = true;
    }
  };
</script>

{#if showMergeModal}
  <ProposeMerge
    bind:person1={originalPerson}
    bind:person2
    bind:potentialMergePeople
    on:close={() => (showMergeModal = false)}
    on:differentFaces={() => {
      showMergeModal = false;
    }}
    on:mergeFaces={() => handleMergeSameFace()}
  />
{/if}

{#if isMultiSelectionMode}
  <AssetSelectControlBar assets={selectedAssets} clearSelect={() => (selectedAssets = new Set())}>
    <CreateSharedLink />
    <CircleIconButton title="Select all" logo={SelectAll} on:click={handleSelectAll} />
    <AssetSelectContextMenu icon={Plus} title="Add">
      <AddToAlbum />
      <AddToAlbum shared />
    </AssetSelectContextMenu>
    <DeleteAssets {onAssetDelete} />
    <AssetSelectContextMenu icon={DotsVertical} title="Add">
      <DownloadAction menuItem filename="{data.person.name || 'immich'}.zip" />
      <FavoriteAction menuItem removeFavorite={isAllFavorite} />
      <ArchiveAction menuItem unarchive={isAllArchive} onAssetArchive={(asset) => onAssetDelete(asset.id)} />
    </AssetSelectContextMenu>
  </AssetSelectControlBar>
{:else}
  <ControlAppBar showBackButton backIcon={ArrowLeft} on:close-button-click={() => goto(previousRoute)}>
    <svelte:fragment slot="trailing">
      <AssetSelectContextMenu icon={DotsVertical} title="Menu">
        <MenuOption text="Change feature photo" on:click={() => (showFaceThumbnailSelection = true)} />
        <MenuOption text="Merge face" on:click={() => (showMergeFacePanel = true)} />
      </AssetSelectContextMenu>
    </svelte:fragment>
  </ControlAppBar>
{/if}

<!-- Face information block -->
<section class="flex place-items-center px-4 pt-24 sm:px-6">
  {#if isEditingName}
    <div class="max-w-lg rounded-lg">
      <EditNameInput
        bind:textEntered
        bind:isEditingName
        person={data.person}
        on:change={(event) => handleNameChange(event.detail)}
        on:outclick={() => (isEditingName = false)}
      />
      <div class="absolute z-[9999]">
        <div class=" w-full border bg-gray-100 dark:border-transparent dark:bg-gray-700">
          {#each peopleDiscovery as person (person.id)}
            {#if person.name && person.id != data.person.id}
              <div class="border-t dark:border-immich-dark-gray">
                <button
                  on:click={() => {
                    textEntered = person.name;
                    data.person.id = person.id;
                    data.person.thumbnailPath = person.thumbnailPath;
                  }}
                >
                  <div class=" m-2 flex items-center">
                    <ImageThumbnail
                      circle
                      shadow
                      url={api.getPeopleThumbnailUrl(person.id)}
                      altText={person.name}
                      widthStyle="2rem"
                      heightStyle="2rem"
                    />

                    <div class="ml-4 flex w-full justify-between gap-2 bg-gray-100 dark:bg-gray-700 dark:text-white">
                      {person.name}
                    </div>
                  </div>
                </button>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <button on:click={() => (showFaceThumbnailSelection = true)}>
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

<!-- Gallery Block -->
{#if showAssets}
  <section class="relative mb-12 bg-immich-bg pt-8 dark:bg-immich-dark-bg sm:px-4">
    <section class="immich-scrollbar relative overflow-y-scroll">
      <section id="search-content" class="relative bg-immich-bg dark:bg-immich-dark-bg">
        <GalleryViewer assets={data.assets} viewFrom="search-page" showArchiveIcon={true} bind:selectedAssets />
      </section>
    </section>
  </section>
{/if}

{#if showFaceThumbnailSelection}
  <FaceThumbnailSelector assets={data.assets} on:go-back={handleSelectFeaturePhoto} />
{/if}

{#if showMergeFacePanel}
  <MergeFaceSelector person={data.person} on:go-back={() => (showMergeFacePanel = false)} />
{/if}
