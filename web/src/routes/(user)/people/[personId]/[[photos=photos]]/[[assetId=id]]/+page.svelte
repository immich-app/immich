<script lang="ts">
  import { afterNavigate, goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { clickOutside } from '$lib/actions/click-outside';
  import { listNavigation } from '$lib/actions/list-navigation';
  import { scrollMemoryClearer } from '$lib/actions/scroll-memory';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import EditNameInput from '$lib/components/faces-page/edit-name-input.svelte';
  import MergeFaceSelector from '$lib/components/faces-page/merge-face-selector.svelte';
  import UnMergeFaceSelector from '$lib/components/faces-page/unmerge-face-selector.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import AddToAlbum from '$lib/components/timeline/actions/AddToAlbumAction.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { AppRoute, PersonPageViewMode, QueryParameter, SessionStorageKey } from '$lib/constants';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import PersonEditBirthDateModal from '$lib/modals/PersonEditBirthDateModal.svelte';
  import PersonMergeSuggestionModal from '$lib/modals/PersonMergeSuggestionModal.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { locale } from '$lib/stores/preferences.store';
  import { preferences } from '$lib/stores/user.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { getPeopleThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { isExternalUrl } from '$lib/utils/navigation';
  import {
    AssetVisibility,
    getPersonStatistics,
    searchPerson,
    updatePerson,
    type PersonResponseDto,
  } from '@immich/sdk';
  import { LoadingSpinner, modalManager } from '@immich/ui';
  import {
    mdiAccountBoxOutline,
    mdiAccountMultipleCheckOutline,
    mdiArrowLeft,
    mdiCalendarEditOutline,
    mdiDotsVertical,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiHeartMinusOutline,
    mdiHeartOutline,
    mdiPlus,
  } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let numberOfAssets = $state(data.statistics.assets);
  let { isViewing: showAssetViewer } = assetViewingStore;

  const timelineManager = new TimelineManager();
  $effect(() => void timelineManager.updateOptions({ visibility: AssetVisibility.Timeline, personId: data.person.id }));
  onDestroy(() => timelineManager.destroy());

  const assetInteraction = new AssetInteraction();

  let viewMode: PersonPageViewMode = $state(PersonPageViewMode.VIEW_ASSETS);
  let isEditingName = $state(false);
  let previousRoute: string = $state(AppRoute.EXPLORE);
  let people: PersonResponseDto[] = [];
  let personMerge1: PersonResponseDto | undefined = $state();
  let personMerge2: PersonResponseDto | undefined = $state();
  let potentialMergePeople: PersonResponseDto[] = $state([]);
  let isSuggestionSelectedByUser = $state(false);

  let personName = '';
  let suggestedPeople: PersonResponseDto[] = $state([]);

  /**
   * Save the word used to search people name: for example,
   * if searching 'r' and the server returns 15 people with names starting with 'r',
   * there's no need to search again people with name starting with 'ri'.
   * However, it needs to make a new api request if searching 'r' returns 20 names (arbitrary value, the limit sent back by the server).
   * or if the new search word starts with another word / letter
   **/
  let isSearchingPeople = $state(false);
  let suggestionContainer: HTMLElement | undefined = $state();

  onMount(() => {
    const action = $page.url.searchParams.get(QueryParameter.ACTION);
    const getPreviousRoute = $page.url.searchParams.get(QueryParameter.PREVIOUS_ROUTE);
    if (getPreviousRoute && !isExternalUrl(getPreviousRoute)) {
      previousRoute = getPreviousRoute;
    }
    if (action == 'merge') {
      viewMode = PersonPageViewMode.MERGE_PEOPLE;
    }

    return websocketEvents.on('on_person_thumbnail', (personId: string) => {
      if (person.id === personId) {
        thumbnailData = getPeopleThumbnailUrl(person, Date.now().toString());
      }
    });
  });

  const handleEscape = async () => {
    if ($showAssetViewer) {
      return;
    }
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    } else {
      await goto(previousRoute);
      return;
    }
  };

  const updateAssetCount = async () => {
    try {
      const { assets } = await getPersonStatistics({ id: person.id });
      numberOfAssets = assets;
    } catch (error) {
      handleError(error, "Can't update the asset count");
    }
  };

  afterNavigate(({ from }) => {
    // Prevent setting previousRoute to the current page.
    if (from?.url && from.route.id !== $page.route.id) {
      previousRoute = from.url.href;
    }
  });

  const handleUnmerge = () => {
    timelineManager.removeAssets(assetInteraction.selectedAssets.map((a) => a.id));
    assetInteraction.clearMultiselect();
    viewMode = PersonPageViewMode.VIEW_ASSETS;
  };

  const handleReassignAssets = () => {
    viewMode = PersonPageViewMode.UNASSIGN_ASSETS;
  };

  const toggleHidePerson = async () => {
    try {
      await updatePerson({
        id: person.id,
        personUpdateDto: { isHidden: !person.isHidden },
      });

      notificationController.show({
        message: $t('changed_visibility_successfully'),
        type: NotificationType.Info,
      });

      await goto(previousRoute);
    } catch (error) {
      handleError(error, $t('errors.unable_to_hide_person'));
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const updatedPerson = await updatePerson({
        id: person.id,
        personUpdateDto: { isFavorite: !person.isFavorite },
      });

      // Invalidate to reload the page data and have the favorite status updated
      await invalidateAll();

      notificationController.show({
        message: updatedPerson.isFavorite ? $t('added_to_favorites') : $t('removed_from_favorites'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: person.isFavorite } }));
    }
  };

  const handleMerge = async (person: PersonResponseDto) => {
    await updateAssetCount();
    await handleGoBack();

    data = { ...data, person };
  };

  const handleSelectFeaturePhoto = async (asset: TimelineAsset) => {
    if (viewMode !== PersonPageViewMode.SELECT_PERSON) {
      return;
    }
    try {
      person = await updatePerson({ id: person.id, personUpdateDto: { featureFaceAssetId: asset.id } });
      notificationController.show({ message: $t('feature_photo_updated'), type: NotificationType.Info });
    } catch (error) {
      handleError(error, $t('errors.unable_to_set_feature_photo'));
    }

    assetInteraction.clearMultiselect();

    viewMode = PersonPageViewMode.VIEW_ASSETS;
  };

  const handleMergeSuggestion = async (): Promise<{ merged: boolean }> => {
    if (!personMerge1 || !personMerge2) {
      return { merged: false };
    }

    const result = await modalManager.show(PersonMergeSuggestionModal, {
      personToMerge: personMerge1,
      personToBeMergedInto: personMerge2,
      potentialMergePeople,
    });

    if (!result) {
      return { merged: false };
    }

    const [personToMerge, personToBeMergedInto] = result;

    people = people.filter((person: PersonResponseDto) => person.id !== personToMerge.id);
    if (personToBeMergedInto.name != personName && person.id === personToBeMergedInto.id) {
      await updateAssetCount();
      return { merged: true };
    }
    await goto(`${AppRoute.PEOPLE}/${personToBeMergedInto.id}`, { replaceState: true });
    return { merged: true };
  };

  const handleSuggestPeople = async (person2: PersonResponseDto) => {
    isEditingName = false;
    if (person.id !== person2.id) {
      potentialMergePeople = [];
      personName = person.name;
      personMerge1 = person;
      personMerge2 = person2;
      isSuggestionSelectedByUser = true;

      await handleMergeSuggestion();
    }
  };

  const changeName = async () => {
    viewMode = PersonPageViewMode.VIEW_ASSETS;
    person.name = personName;
    isEditingName = false;

    if (isSuggestionSelectedByUser) {
      // User canceled the merge
      isSuggestionSelectedByUser = false;
      return;
    }

    try {
      person = await updatePerson({ id: person.id, personUpdateDto: { name: personName } });

      notificationController.show({
        message: $t('change_name_successfully'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  const handleCancelEditName = () => {
    isSearchingPeople = false;
    isEditingName = false;
  };

  const handleNameChange = async (name: string) => {
    isEditingName = false;
    potentialMergePeople = [];
    personName = name;

    if (person.name === personName) {
      return;
    }
    if (name === '') {
      await changeName();
      return;
    }

    const result = await searchPerson({ name: personName, withHidden: true });

    const existingPerson = result.find(
      ({ name, id }: PersonResponseDto) => name.toLowerCase() === personName.toLowerCase() && id !== person.id && name,
    );
    if (existingPerson) {
      personMerge2 = existingPerson;
      personMerge1 = person;
      potentialMergePeople = result
        .filter(
          (person: PersonResponseDto) =>
            personMerge2?.name.toLowerCase() === person.name.toLowerCase() &&
            person.id !== personMerge2.id &&
            person.id !== personMerge1?.id &&
            !person.isHidden,
        )
        .slice(0, 3);
      const { merged } = await handleMergeSuggestion();
      if (merged) {
        return;
      }
    }
    await changeName();
  };

  const handleSetBirthDate = async () => {
    const updatedPerson = await modalManager.show(PersonEditBirthDateModal, { person });

    if (!updatedPerson) {
      return;
    }

    person = updatedPerson;
    people = people.map((person: PersonResponseDto) => {
      if (person.id === updatedPerson.id) {
        return updatedPerson;
      }
      return person;
    });
  };

  const handleGoBack = async () => {
    viewMode = PersonPageViewMode.VIEW_ASSETS;
    if ($page.url.searchParams.has(QueryParameter.ACTION)) {
      $page.url.searchParams.delete(QueryParameter.ACTION);
      await goto($page.url);
    }
  };

  const handleDeleteAssets = async (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    await updateAssetCount();
  };

  const handleUndoDeleteAssets = async (assets: TimelineAsset[]) => {
    timelineManager.addAssets(assets);
    await updateAssetCount();
  };

  let person = $derived(data.person);

  let thumbnailData = $derived(getPeopleThumbnailUrl(person));

  $effect(() => {
    if (person) {
      handlePromiseError(updateAssetCount());
    }
  });

  const handleSetVisibility = (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    assetInteraction.clearMultiselect();
  };
</script>

<main
  class="relative z-0 h-dvh overflow-hidden px-2 md:px-6 md:pt-(--navbar-height-md) pt-(--navbar-height)"
  use:scrollMemoryClearer={{
    routeStartsWith: AppRoute.PEOPLE,
    beforeClear: () => {
      sessionStorage.removeItem(SessionStorageKey.INFINITE_SCROLL_PAGE);
    },
  }}
>
  {#key person.id}
    <Timeline
      enableRouting={true}
      {person}
      {timelineManager}
      {assetInteraction}
      isSelectionMode={viewMode === PersonPageViewMode.SELECT_PERSON}
      singleSelect={viewMode === PersonPageViewMode.SELECT_PERSON}
      onSelect={handleSelectFeaturePhoto}
      onEscape={handleEscape}
    >
      {#if viewMode === PersonPageViewMode.VIEW_ASSETS}
        <!-- Person information block -->
        <div
          class="relative w-fit p-4 sm:px-6 pt-12"
          use:clickOutside={{
            onOutclick: handleCancelEditName,
            onEscape: handleCancelEditName,
          }}
          use:listNavigation={suggestionContainer}
        >
          <section class="flex w-64 sm:w-96 place-items-center border-black">
            {#if isEditingName}
              <EditNameInput
                {person}
                bind:suggestedPeople
                name={person.name}
                bind:isSearchingPeople
                onChange={handleNameChange}
                {thumbnailData}
              />
            {:else}
              <div class="relative">
                <button
                  type="button"
                  class="flex items-center justify-center"
                  title={$t('edit_name')}
                  onclick={() => (isEditingName = true)}
                >
                  <ImageThumbnail
                    circle
                    shadow
                    url={thumbnailData}
                    altText={person.name}
                    widthStyle="3.375rem"
                    heightStyle="3.375rem"
                  />
                  <div class="flex flex-col justify-center text-start px-4 text-primary">
                    <p class="w-40 sm:w-72 font-medium truncate">{person.name || $t('add_a_name')}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {$t('assets_count', { values: { count: numberOfAssets } })}
                    </p>
                    {#if person.birthDate}
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {$t('person_birthdate', {
                          values: {
                            date: DateTime.fromISO(person.birthDate).toLocaleString(
                              {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric',
                              },
                              { locale: $locale },
                            ),
                          },
                        })}
                      </p>
                    {/if}
                  </div>
                </button>
              </div>
            {/if}
          </section>
          {#if isEditingName}
            <div class="absolute w-64 sm:w-96 z-1">
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
                      type="button"
                      class="flex w-full border border-gray-200 dark:border-immich-dark-gray h-14 place-items-center bg-gray-100 p-2 dark:bg-gray-700 hover:bg-gray-300 hover:dark:bg-[#232932] focus:bg-gray-300 focus:dark:bg-[#232932] {index ===
                      suggestedPeople.length - 1
                        ? 'rounded-b-lg border-b'
                        : ''}"
                      onclick={() => handleSuggestPeople(person)}
                    >
                      <ImageThumbnail
                        circle
                        shadow
                        url={getPeopleThumbnailUrl(person)}
                        altText={person.name}
                        widthStyle="2rem"
                        heightStyle="2rem"
                      />
                      <p class="ms-4 text-gray-700 dark:text-gray-100">{person.name}</p>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </Timeline>
  {/key}
</main>

<header>
  {#if assetInteraction.selectionActive}
    <AssetSelectControlBar
      assets={assetInteraction.selectedAssets}
      clearSelect={() => assetInteraction.clearMultiselect()}
    >
      <CreateSharedLink />
      <SelectAllAssets {timelineManager} {assetInteraction} />
      <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
        <AddToAlbum />
        <AddToAlbum shared />
      </ButtonContextMenu>
      <FavoriteAction
        removeFavorite={assetInteraction.isAllFavorite}
        onFavorite={(ids, isFavorite) =>
          timelineManager.updateAssetOperation(ids, (asset) => {
            asset.isFavorite = isFavorite;
            return { remove: false };
          })}
      />
      <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
        <DownloadAction menuItem filename="{person.name || 'immich'}.zip" />
        <MenuOption
          icon={mdiAccountMultipleCheckOutline}
          text={$t('fix_incorrect_match')}
          onClick={handleReassignAssets}
        />
        <ChangeDate menuItem />
        <ChangeDescription menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction
          menuItem
          unarchive={assetInteraction.isAllArchived}
          onArchive={(assetIds) => timelineManager.removeAssets(assetIds)}
        />
        {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
          <TagAction menuItem />
        {/if}
        <SetVisibilityAction menuItem onVisibilitySet={handleSetVisibility} />
        <DeleteAssets
          menuItem
          onAssetDelete={(assetIds) => handleDeleteAssets(assetIds)}
          onUndoDelete={(assets) => handleUndoDeleteAssets(assets)}
        />
      </ButtonContextMenu>
    </AssetSelectControlBar>
  {:else}
    {#if viewMode === PersonPageViewMode.VIEW_ASSETS}
      <ControlAppBar showBackButton backIcon={mdiArrowLeft} onClose={() => goto(previousRoute)}>
        {#snippet trailing()}
          <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
            <MenuOption
              text={$t('select_featured_photo')}
              icon={mdiAccountBoxOutline}
              onClick={() => (viewMode = PersonPageViewMode.SELECT_PERSON)}
            />
            <MenuOption
              text={person.isHidden ? $t('unhide_person') : $t('hide_person')}
              icon={person.isHidden ? mdiEyeOutline : mdiEyeOffOutline}
              onClick={() => toggleHidePerson()}
            />
            <MenuOption text={$t('set_date_of_birth')} icon={mdiCalendarEditOutline} onClick={handleSetBirthDate} />
            <MenuOption
              text={$t('merge_people')}
              icon={mdiAccountMultipleCheckOutline}
              onClick={() => (viewMode = PersonPageViewMode.MERGE_PEOPLE)}
            />
            <MenuOption
              icon={person.isFavorite ? mdiHeartMinusOutline : mdiHeartOutline}
              text={person.isFavorite ? $t('unfavorite') : $t('to_favorite')}
              onClick={handleToggleFavorite}
            />
          </ButtonContextMenu>
        {/snippet}
      </ControlAppBar>
    {/if}

    {#if viewMode === PersonPageViewMode.SELECT_PERSON}
      <ControlAppBar onClose={() => (viewMode = PersonPageViewMode.VIEW_ASSETS)}>
        {#snippet leading()}
          {$t('select_featured_photo')}
        {/snippet}
      </ControlAppBar>
    {/if}
  {/if}
</header>

{#if viewMode === PersonPageViewMode.UNASSIGN_ASSETS}
  <UnMergeFaceSelector
    assetIds={assetInteraction.selectedAssets.map((a) => a.id)}
    personAssets={person}
    onClose={() => (viewMode = PersonPageViewMode.VIEW_ASSETS)}
    onConfirm={handleUnmerge}
  />
{/if}

{#if viewMode === PersonPageViewMode.MERGE_PEOPLE}
  <MergeFaceSelector {person} onBack={handleGoBack} onMerge={handleMerge} />
{/if}
