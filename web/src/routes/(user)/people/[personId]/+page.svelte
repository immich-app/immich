<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import EditNameInput from '$lib/components/faces-page/edit-name-input.svelte';
  import MergeFaceSelector from '$lib/components/faces-page/merge-face-selector.svelte';
  import UnMergeFaceSelector from '$lib/components/faces-page/unmerge-face-selector.svelte';
  import MergeSuggestionModal from '$lib/components/faces-page/merge-suggestion-modal.svelte';
  import SetBirthDateModal from '$lib/components/faces-page/set-birth-date-modal.svelte';
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
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { AppRoute, QueryParameter, maximumLengthSearchPeople, timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { websocketStore } from '$lib/stores/websocket';
  import { handleError } from '$lib/utils/handle-error';
  import { type AssetResponseDto, type PersonResponseDto, api } from '@api';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { clickOutside } from '$lib/utils/click-outside';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { mdiPlus, mdiDotsVertical, mdiArrowLeft } from '@mdi/js';
  import { isExternalUrl } from '$lib/utils/navigation';
  import { searchNameLocal } from '$lib/utils/person';

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
  const { onPersonThumbnail } = websocketStore;

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
  $: thumbnailData = api.getPeopleThumbnailUrl(data.person.id);

  let name: string = data.person.name;
  let suggestedPeople: PersonResponseDto[] = [];

  /**
   * Save the word used to search people name: for example,
   * if searching 'r' and the server returns 15 people with names starting with 'r',
   * there's no need to search again people with name starting with 'ri'.
   * However, it needs to make a new api request if searching 'r' returns 20 names (arbitrary value, the limit sent back by the server).
   * or if the new search word starts with another word / letter
   **/
  let searchWord: string;
  let isSearchingPeople = false;

  const searchPeople = async () => {
    if ((people.length < maximumLengthSearchPeople && name.startsWith(searchWord)) || name === '') {
      return;
    }
    const timeout = setTimeout(() => (isSearchingPeople = true), timeBeforeShowLoadingSpinner);
    try {
      const { data } = await api.searchApi.searchPerson({ name });
      people = data;
      searchWord = name;
    } catch (error) {
      people = [];
      handleError(error, "Can't search people");
    } finally {
      clearTimeout(timeout);
    }

    isSearchingPeople = false;
  };

  $: isAllArchive = [...$selectedAssets].every((asset) => asset.isArchived);
  $: isAllFavorite = [...$selectedAssets].every((asset) => asset.isFavorite);
  $: $onPersonThumbnail === data.person.id &&
    (thumbnailData = api.getPeopleThumbnailUrl(data.person.id) + `?now=${Date.now()}`);

  $: {
    if (people) {
      suggestedPeople = name ? searchNameLocal(name, people, 5, data.person.id) : [];
    }
  }

  onMount(() => {
    const action = $page.url.searchParams.get(QueryParameter.ACTION);
    const getPreviousRoute = $page.url.searchParams.get(QueryParameter.PREVIOUS_ROUTE);
    if (getPreviousRoute && !isExternalUrl(getPreviousRoute)) {
      previousRoute = getPreviousRoute;
    }
    if (action == 'merge') {
      viewMode = ViewMode.MERGE_PEOPLE;
    }
  });
  const handleEscape = () => {
    if ($showAssetViewer) {
      return;
    }
    if ($isMultiSelectState) {
      assetInteractionStore.clearMultiselect();
      return;
    } else {
      goto(previousRoute);
      return;
    }
  };
  afterNavigate(({ from }) => {
    // Prevent setting previousRoute to the current page.
    if (from && from.route.id !== $page.route.id) {
      previousRoute = from.url.href;
    }
    if (previousPersonId !== data.person.id) {
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
      await api.personApi.updatePerson({
        id: data.person.id,
        personUpdateDto: { isHidden: !data.person.isHidden },
      });

      notificationController.show({
        message: 'Changed visibility succesfully',
        type: NotificationType.Info,
      });

      goto(previousRoute, { replaceState: true });
    } catch (error) {
      handleError(error, 'Unable to hide person');
    }
  };

  const handleMerge = async (person: PersonResponseDto) => {
    const { data: statistics } = await api.personApi.getPersonStatistics({ id: person.id });
    numberOfAssets = statistics.assets;
    handleGoBack();

    data.person = person;

    refreshAssetGrid = !refreshAssetGrid;
  };

  const handleSelectFeaturePhoto = async (asset: AssetResponseDto) => {
    if (viewMode !== ViewMode.SELECT_PERSON) {
      return;
    }

    await api.personApi.updatePerson({ id: data.person.id, personUpdateDto: { featureFaceAssetId: asset.id } });

    notificationController.show({ message: 'Feature photo updated', type: NotificationType.Info });
    assetInteractionStore.clearMultiselect();

    viewMode = ViewMode.VIEW_ASSETS;
  };

  const updateAssetCount = async () => {
    try {
      const { data: statistics } = await api.personApi.getPersonStatistics({
        id: data.person.id,
      });
      numberOfAssets = statistics.assets;
    } catch (error) {
      handleError(error, "Can't update the asset count");
    }
  };

  const handleMergeSamePerson = async (response: [PersonResponseDto, PersonResponseDto]) => {
    const [personToMerge, personToBeMergedIn] = response;
    viewMode = ViewMode.VIEW_ASSETS;
    isEditingName = false;
    try {
      await api.personApi.mergePerson({
        id: personToBeMergedIn.id,
        mergePersonDto: { ids: [personToMerge.id] },
      });
      notificationController.show({
        message: 'Merge people succesfully',
        type: NotificationType.Info,
      });
      people = people.filter((person: PersonResponseDto) => person.id !== personToMerge.id);
      if (personToBeMergedIn.name != personName && data.person.id === personToBeMergedIn.id) {
        await updateAssetCount();
        refreshAssetGrid = !refreshAssetGrid;
        return;
      }
      goto(`${AppRoute.PEOPLE}/${personToBeMergedIn.id}`, { replaceState: true });
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

      await api.personApi.updatePerson({
        id: data.person.id,
        personUpdateDto: { name: personName },
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
      changeName();
      return;
    }

    const result = await api.searchApi.searchPerson({ name: personName, withHidden: true });

    const existingPerson = result.data.find(
      (person: PersonResponseDto) =>
        person.name.toLowerCase() === personName.toLowerCase() && person.id !== data.person.id && person.name,
    );
    if (existingPerson) {
      personMerge2 = existingPerson;
      personMerge1 = data.person;
      potentialMergePeople = result.data
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
    changeName();
  };

  const handleSetBirthDate = async (birthDate: string) => {
    try {
      viewMode = ViewMode.VIEW_ASSETS;
      data.person.birthDate = birthDate;

      const { data: updatedPerson } = await api.personApi.updatePerson({
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

  const handleGoBack = () => {
    viewMode = ViewMode.VIEW_ASSETS;
    if ($page.url.searchParams.has(QueryParameter.ACTION)) {
      $page.url.searchParams.delete(QueryParameter.ACTION);
      goto($page.url);
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
      <AssetSelectContextMenu icon={mdiPlus} title="Add">
        <AddToAlbum />
        <AddToAlbum shared />
      </AssetSelectContextMenu>
      <DeleteAssets onAssetDelete={(assetId) => $assetStore.removeAsset(assetId)} />
      <AssetSelectContextMenu icon={mdiDotsVertical} title="Add">
        <DownloadAction menuItem filename="{data.person.name || 'immich'}.zip" />
        <FavoriteAction menuItem removeFavorite={isAllFavorite} />
        <ArchiveAction menuItem unarchive={isAllArchive} onArchive={(ids) => $assetStore.removeAssets(ids)} />
        <MenuOption text="Fix incorrect match" on:click={handleReassignAssets} />
        <ChangeDate menuItem />
        <ChangeLocation menuItem />
      </AssetSelectContextMenu>
    </AssetSelectControlBar>
  {:else}
    {#if viewMode === ViewMode.VIEW_ASSETS || viewMode === ViewMode.SUGGEST_MERGE || viewMode === ViewMode.BIRTH_DATE}
      <ControlAppBar showBackButton backIcon={mdiArrowLeft} on:close={() => goto(previousRoute)}>
        <svelte:fragment slot="trailing">
          <AssetSelectContextMenu icon={mdiDotsVertical} title="Menu">
            <MenuOption text="Change feature photo" on:click={() => (viewMode = ViewMode.SELECT_PERSON)} />
            <MenuOption text="Set date of birth" on:click={() => (viewMode = ViewMode.BIRTH_DATE)} />
            <MenuOption text="Merge person" on:click={() => (viewMode = ViewMode.MERGE_PEOPLE)} />
            <MenuOption
              text={data.person.isHidden ? 'Unhide person' : 'Hide person'}
              on:click={() => toggleHidePerson()}
            />
          </AssetSelectContextMenu>
        </svelte:fragment>
      </ControlAppBar>
    {/if}

    {#if viewMode === ViewMode.SELECT_PERSON}
      <ControlAppBar on:close={() => (viewMode = ViewMode.VIEW_ASSETS)}>
        <svelte:fragment slot="leading">Select feature photo</svelte:fragment>
      </ControlAppBar>
    {/if}
  {/if}
</header>

<main class="relative h-screen overflow-hidden bg-immich-bg pt-[var(--navbar-height)] dark:bg-immich-dark-bg">
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
          role="button"
          class="relative w-fit p-4 sm:px-6"
          use:clickOutside
          on:outclick={handleCancelEditName}
          on:escape={handleCancelEditName}
        >
          <section class="flex w-64 sm:w-96 place-items-center border-black">
            {#if isEditingName}
              <EditNameInput
                person={data.person}
                suggestedPeople={suggestedPeople.length > 0 || isSearchingPeople}
                bind:name
                on:change={(event) => handleNameChange(event.detail)}
                on:input={searchPeople}
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
                {#each suggestedPeople as person, index (person.id)}
                  <div
                    class="flex border-t border-x border-gray-400 dark:border-immich-dark-gray h-14 place-items-center bg-gray-200 p-2 dark:bg-gray-700 hover:bg-gray-300 hover:dark:bg-[#232932] {index ===
                    suggestedPeople.length - 1
                      ? 'rounded-b-lg border-b'
                      : ''}"
                  >
                    <button class="flex w-full place-items-center" on:click={() => handleSuggestPeople(person)}>
                      <ImageThumbnail
                        circle
                        shadow
                        url={api.getPeopleThumbnailUrl(person.id)}
                        altText={person.name}
                        widthStyle="2rem"
                        heightStyle="2rem"
                      />
                      <p class="ml-4 text-gray-700 dark:text-gray-100">{person.name}</p>
                    </button>
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </AssetGrid>
  {/key}
</main>
