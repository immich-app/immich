<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import EditNameInput from '$lib/components/faces-page/edit-name-input.svelte';
  import MergeFaceSelector from '$lib/components/faces-page/merge-face-selector.svelte';
  import MergeSuggestionModal from '$lib/components/faces-page/merge-suggestion-modal.svelte';
  import SetBirthDateModal from '$lib/components/faces-page/set-birth-date-modal.svelte';
  import UnMergeFaceSelector from '$lib/components/faces-page/unmerge-face-selector.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
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
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { getPeopleThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { clickOutside } from '$lib/utils/click-outside';
  import { handleError } from '$lib/utils/handle-error';
  import { isExternalUrl } from '$lib/utils/navigation';
  import {
    getPersonStatistics,
    mergePerson,
    searchPerson,
    updatePerson,
    type AssetResponseDto,
    type PersonResponseDto,
  } from '@immich/sdk';
  import {
    mdiAccountBoxOutline,
    mdiAccountMultipleCheckOutline,
    mdiArrowLeft,
    mdiCalendarEditOutline,
    mdiDotsVertical,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiPlus,
  } from '@mdi/js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { listNavigation } from '$lib/utils/list-navigation';

  export let data: PageData;

  let numberOfAssets = data.statistics.assets;
  let { isViewing: showAssetViewer } = assetViewingStore;

  enum ViewMode {
    VIEW_ASSETS = 'view-assets',
    SELECT_PERSON = 'select-person',
    MERGE_PEOPLE = 'merge-people',
    SUGGEST_MERGE = 'suggest-merge',
    BIRTH_DATE = 'birth-date',
    UNASSIGN_ASSETS = 'unassign-faces',
  }

  let assetStore = new AssetStore({
    isArchived: false,
    personId: data.person.id,
  });
  const assetInteractionStore = createAssetInteractionStore();
  const { selectedAssets, isMultiSelectState } = assetInteractionStore;

  let viewMode: ViewMode = ViewMode.VIEW_ASSETS;
  let isEditingName = false;
  let previousRoute: string = AppRoute.EXPLORE;
  let previousPersonId: string = data.person.id;
  let people: PersonResponseDto[] = [];
  let personMerge1: PersonResponseDto;
  let personMerge2: PersonResponseDto;
  let potentialMergePeople: PersonResponseDto[] = [];

  let refreshAssetGrid = false;

  let personName = '';
  $: thumbnailData = getPeopleThumbnailUrl(data.person.id);

  let name: string = data.person.name;
  let suggestedPeople: PersonResponseDto[] = [];

  /**
   * Save the word used to search people name: for example,
   * if searching 'r' and the server returns 15 people with names starting with 'r',
   * there's no need to search again people with name starting with 'ri'.
   * However, it needs to make a new api request if searching 'r' returns 20 names (arbitrary value, the limit sent back by the server).
   * or if the new search word starts with another word / letter
   **/
  let isSearchingPeople = false;
  let suggestionContainer: HTMLDivElement;

  $: isAllArchive = [...$selectedAssets].every((asset) => asset.isArchived);
  $: isAllFavorite = [...$selectedAssets].every((asset) => asset.isFavorite);

  onMount(() => {
    const action = $page.url.searchParams.get(QueryParameter.ACTION);
    const getPreviousRoute = $page.url.searchParams.get(QueryParameter.PREVIOUS_ROUTE);
    if (getPreviousRoute && !isExternalUrl(getPreviousRoute)) {
      previousRoute = getPreviousRoute;
    }
    if (action == 'merge') {
      viewMode = ViewMode.MERGE_PEOPLE;
    }

    return websocketEvents.on('on_person_thumbnail', (personId: string) => {
      if (data.person.id === personId) {
        thumbnailData = getPeopleThumbnailUrl(data.person.id) + `?now=${Date.now()}`;
      }
    });
  });

  const handleEscape = async () => {
    if ($showAssetViewer || viewMode === ViewMode.SUGGEST_MERGE) {
      return;
    }
    if ($isMultiSelectState) {
      assetInteractionStore.clearMultiselect();
      return;
    } else {
      await goto(previousRoute);
      return;
    }
  };

  const updateAssetCount = async () => {
    try {
      const { assets } = await getPersonStatistics({ id: data.person.id });
      numberOfAssets = assets;
    } catch (error) {
      handleError(error, "Can't update the asset count");
    }
  };

  afterNavigate(({ from }) => {
    // Prevent setting previousRoute to the current page.
    if (from && from.route.id !== $page.route.id) {
      previousRoute = from.url.href;
    }
    if (previousPersonId !== data.person.id) {
      handlePromiseError(updateAssetCount());
      assetStore = new AssetStore({
        isArchived: false,
        personId: data.person.id,
      });
      previousPersonId = data.person.id;
      name = data.person.name;
      refreshAssetGrid = !refreshAssetGrid;
    }
  });

  const handleUnmerge = () => {
    $assetStore.removeAssets([...$selectedAssets].map((a) => a.id));
    assetInteractionStore.clearMultiselect();
    viewMode = ViewMode.VIEW_ASSETS;
  };

  const handleReassignAssets = () => {
    viewMode = ViewMode.UNASSIGN_ASSETS;
  };

  const toggleHidePerson = async () => {
    try {
      await updatePerson({
        id: data.person.id,
        personUpdateDto: { isHidden: !data.person.isHidden },
      });

      notificationController.show({
        message: 'Changed visibility successfully',
        type: NotificationType.Info,
      });

      await goto(previousRoute, { replaceState: true });
    } catch (error) {
      handleError(error, 'Unable to hide person');
    }
  };

  const handleMerge = async (person: PersonResponseDto) => {
    await updateAssetCount();
    await handleGoBack();

    data.person = person;

    refreshAssetGrid = !refreshAssetGrid;
  };

  const handleSelectFeaturePhoto = async (asset: AssetResponseDto) => {
    if (viewMode !== ViewMode.SELECT_PERSON) {
      return;
    }

    await updatePerson({ id: data.person.id, personUpdateDto: { featureFaceAssetId: asset.id } });

    notificationController.show({ message: 'Feature photo updated', type: NotificationType.Info });
    assetInteractionStore.clearMultiselect();

    viewMode = ViewMode.VIEW_ASSETS;
  };

  const handleMergeSamePerson = async (response: [PersonResponseDto, PersonResponseDto]) => {
    const [personToMerge, personToBeMergedIn] = response;
    viewMode = ViewMode.VIEW_ASSETS;
    isEditingName = false;
    try {
      await mergePerson({
        id: personToBeMergedIn.id,
        mergePersonDto: { ids: [personToMerge.id] },
      });
      notificationController.show({
        message: 'Merge people successfully',
        type: NotificationType.Info,
      });
      people = people.filter((person: PersonResponseDto) => person.id !== personToMerge.id);
      if (personToBeMergedIn.name != personName && data.person.id === personToBeMergedIn.id) {
        await updateAssetCount();
        refreshAssetGrid = !refreshAssetGrid;
        return;
      }
      await goto(`${AppRoute.PEOPLE}/${personToBeMergedIn.id}`, { replaceState: true });
    } catch (error) {
      handleError(error, 'Unable to save name');
    }
  };

  const handleSuggestPeople = (person: PersonResponseDto) => {
    isEditingName = false;
    potentialMergePeople = [];
    personName = person.name;
    personMerge1 = data.person;
    personMerge2 = person;
    viewMode = ViewMode.SUGGEST_MERGE;
  };

  const changeName = async () => {
    viewMode = ViewMode.VIEW_ASSETS;
    data.person.name = personName;
    try {
      isEditingName = false;

      await updatePerson({ id: data.person.id, personUpdateDto: { name: personName } });

      notificationController.show({
        message: 'Change name successfully',
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
    isSearchingPeople = false;
    isEditingName = false;
  };

  const handleNameChange = async (name: string) => {
    isEditingName = false;
    potentialMergePeople = [];
    personName = name;

    if (data.person.name === personName) {
      return;
    }
    if (name === '') {
      await changeName();
      return;
    }

    const result = await searchPerson({ name: personName, withHidden: true });

    const existingPerson = result.find(
      (person: PersonResponseDto) =>
        person.name.toLowerCase() === personName.toLowerCase() && person.id !== data.person.id && person.name,
    );
    if (existingPerson) {
      personMerge2 = existingPerson;
      personMerge1 = data.person;
      potentialMergePeople = result
        .filter(
          (person: PersonResponseDto) =>
            personMerge2.name.toLowerCase() === person.name.toLowerCase() &&
            person.id !== personMerge2.id &&
            person.id !== personMerge1.id &&
            !person.isHidden,
        )
        .slice(0, 3);
      viewMode = ViewMode.SUGGEST_MERGE;
      return;
    }
    await changeName();
  };

  const handleSetBirthDate = async (birthDate: string) => {
    try {
      viewMode = ViewMode.VIEW_ASSETS;
      data.person.birthDate = birthDate;

      const updatedPerson = await updatePerson({
        id: data.person.id,
        personUpdateDto: { birthDate: birthDate.length > 0 ? birthDate : null },
      });

      people = people.map((person: PersonResponseDto) => {
        if (person.id === updatedPerson.id) {
          return updatedPerson;
        }
        return person;
      });

      notificationController.show({ message: 'Date of birth saved successfully', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save date of birth');
    }
  };

  const handleGoBack = async () => {
    viewMode = ViewMode.VIEW_ASSETS;
    if ($page.url.searchParams.has(QueryParameter.ACTION)) {
      $page.url.searchParams.delete(QueryParameter.ACTION);
      await goto($page.url);
    }
  };
</script>

{#if viewMode === ViewMode.UNASSIGN_ASSETS}
  <UnMergeFaceSelector
    assetIds={[...$selectedAssets].map((a) => a.id)}
    personAssets={data.person}
    on:close={() => (viewMode = ViewMode.VIEW_ASSETS)}
    on:confirm={handleUnmerge}
  />
{/if}

{#if viewMode === ViewMode.SUGGEST_MERGE}
  <MergeSuggestionModal
    {personMerge1}
    {personMerge2}
    {potentialMergePeople}
    on:close={() => (viewMode = ViewMode.VIEW_ASSETS)}
    on:reject={() => changeName()}
    on:confirm={(event) => handleMergeSamePerson(event.detail)}
  />
{/if}

{#if viewMode === ViewMode.BIRTH_DATE}
  <SetBirthDateModal
    birthDate={data.person.birthDate ?? ''}
    on:close={() => (viewMode = ViewMode.VIEW_ASSETS)}
    on:updated={(event) => handleSetBirthDate(event.detail)}
  />
{/if}

{#if viewMode === ViewMode.MERGE_PEOPLE}
  <MergeFaceSelector person={data.person} on:back={handleGoBack} on:merge={({ detail }) => handleMerge(detail)} />
{/if}

<header>
  {#if $isMultiSelectState}
    <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
      <CreateSharedLink />
      <SelectAllAssets {assetStore} {assetInteractionStore} />
      <AssetSelectContextMenu icon={mdiPlus} title="Add to...">
        <AddToAlbum />
        <AddToAlbum shared />
      </AssetSelectContextMenu>
      <FavoriteAction removeFavorite={isAllFavorite} onFavorite={() => assetStore.triggerUpdate()} />
      <AssetSelectContextMenu icon={mdiDotsVertical} title="Add">
        <DownloadAction menuItem filename="{data.person.name || 'immich'}.zip" />
        <MenuOption icon={mdiAccountMultipleCheckOutline} text="Fix incorrect match" on:click={handleReassignAssets} />
        <ChangeDate menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction menuItem unarchive={isAllArchive} onArchive={(assetIds) => $assetStore.removeAssets(assetIds)} />
        <DeleteAssets menuItem onAssetDelete={(assetIds) => $assetStore.removeAssets(assetIds)} />
      </AssetSelectContextMenu>
    </AssetSelectControlBar>
  {:else}
    {#if viewMode === ViewMode.VIEW_ASSETS || viewMode === ViewMode.SUGGEST_MERGE || viewMode === ViewMode.BIRTH_DATE}
      <ControlAppBar showBackButton backIcon={mdiArrowLeft} on:close={() => goto(previousRoute)}>
        <svelte:fragment slot="trailing">
          <AssetSelectContextMenu icon={mdiDotsVertical} title="Menu">
            <MenuOption
              text="Select featured photo"
              icon={mdiAccountBoxOutline}
              on:click={() => (viewMode = ViewMode.SELECT_PERSON)}
            />
            <MenuOption
              text={data.person.isHidden ? 'Unhide person' : 'Hide person'}
              icon={data.person.isHidden ? mdiEyeOutline : mdiEyeOffOutline}
              on:click={() => toggleHidePerson()}
            />
            <MenuOption
              text="Set date of birth"
              icon={mdiCalendarEditOutline}
              on:click={() => (viewMode = ViewMode.BIRTH_DATE)}
            />
            <MenuOption
              text="Merge people"
              icon={mdiAccountMultipleCheckOutline}
              on:click={() => (viewMode = ViewMode.MERGE_PEOPLE)}
            />
          </AssetSelectContextMenu>
        </svelte:fragment>
      </ControlAppBar>
    {/if}

    {#if viewMode === ViewMode.SELECT_PERSON}
      <ControlAppBar on:close={() => (viewMode = ViewMode.VIEW_ASSETS)}>
        <svelte:fragment slot="leading">Select featured photo</svelte:fragment>
      </ControlAppBar>
    {/if}
  {/if}
</header>

<main class="relative h-screen overflow-hidden bg-immich-bg tall:ml-4 pt-[var(--navbar-height)] dark:bg-immich-dark-bg">
  {#key refreshAssetGrid}
    <AssetGrid
      {assetStore}
      {assetInteractionStore}
      isSelectionMode={viewMode === ViewMode.SELECT_PERSON}
      singleSelect={viewMode === ViewMode.SELECT_PERSON}
      on:select={({ detail: asset }) => handleSelectFeaturePhoto(asset)}
      on:escape={handleEscape}
    >
      {#if viewMode === ViewMode.VIEW_ASSETS || viewMode === ViewMode.SUGGEST_MERGE || viewMode === ViewMode.BIRTH_DATE}
        <!-- Person information block -->
        <div
          class="relative w-fit p-4 sm:px-6"
          use:clickOutside={{
            onOutclick: handleCancelEditName,
            onEscape: handleCancelEditName,
          }}
          use:listNavigation={suggestionContainer}
        >
          <section class="flex w-64 sm:w-96 place-items-center border-black">
            {#if isEditingName}
              <EditNameInput
                person={data.person}
                bind:suggestedPeople
                bind:name
                bind:isSearchingPeople
                on:change={(event) => handleNameChange(event.detail)}
                {thumbnailData}
              />
            {:else}
              <div class="relative">
                <button
                  class="flex items-center justify-center"
                  title="Edit name"
                  on:click={() => (isEditingName = true)}
                >
                  <ImageThumbnail
                    circle
                    shadow
                    url={thumbnailData}
                    altText={data.person.name}
                    widthStyle="3.375rem"
                    heightStyle="3.375rem"
                  />
                  <div
                    class="flex flex-col justify-center text-left px-4 h-14 text-immich-primary dark:text-immich-dark-primary"
                  >
                    {#if data.person.name}
                      <p class="w-40 sm:w-72 font-medium truncate">{data.person.name}</p>
                      <p class="absolute w-fit text-sm text-gray-500 dark:text-immich-gray bottom-0">
                        {`${numberOfAssets} asset${numberOfAssets > 1 ? 's' : ''}`}
                      </p>
                    {:else}
                      <p class="font-medium">Add a name</p>
                      <p class="text-sm text-gray-500 dark:text-immich-gray">Find them fast by name with search</p>
                    {/if}
                  </div>
                </button>
              </div>
            {/if}
          </section>
          {#if isEditingName}
            <div class="absolute z-[999] w-64 sm:w-96">
              {#if isSearchingPeople}
                <div
                  class="flex border h-14 rounded-b-lg border-gray-400 dark:border-immich-dark-gray place-items-center bg-gray-200 p-2 dark:bg-gray-700"
                >
                  <div class="flex w-full place-items-center">
                    <LoadingSpinner />
                  </div>
                </div>
              {:else}
                <div bind:this={suggestionContainer}>
                  {#each suggestedPeople as person, index (person.id)}
                    <button
                      class="flex w-full border-t border-gray-400 dark:border-immich-dark-gray h-14 place-items-center bg-gray-200 p-2 dark:bg-gray-700 hover:bg-gray-300 hover:dark:bg-[#232932] focus:bg-gray-300 focus:dark:bg-[#232932] {index ===
                      suggestedPeople.length - 1
                        ? 'rounded-b-lg border-b'
                        : ''}"
                      on:click={() => handleSuggestPeople(person)}
                    >
                      <ImageThumbnail
                        circle
                        shadow
                        url={getPeopleThumbnailUrl(person.id)}
                        altText={person.name}
                        widthStyle="2rem"
                        heightStyle="2rem"
                      />
                      <p class="ml-4 text-gray-700 dark:text-gray-100">{person.name}</p>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </AssetGrid>
  {/key}
</main>
