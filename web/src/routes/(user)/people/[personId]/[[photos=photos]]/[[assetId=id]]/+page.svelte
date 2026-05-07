<script lang="ts">
  import { afterNavigate, goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { clickOutside } from '$lib/actions/click-outside';
  import { listNavigation } from '$lib/actions/list-navigation';
  import { scrollMemoryClearer } from '$lib/actions/scroll-memory';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import PeopleMergeSelector from '$lib/components/people/people-merge-selector.svelte';
  import EditNameInput from './edit-name-input.svelte';
  import UnMergeFaceSelector from './unmerge-face-selector.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
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
  import { PersonPageViewMode, QueryParameter, SessionStorageKey } from '$lib/constants';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import PersonMergeSuggestionModal from '$lib/modals/PersonMergeSuggestionModal.svelte';
  import RepresentativeFacePickerModal from '$lib/modals/RepresentativeFacePickerModal.svelte';
  import { Route } from '$lib/route';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import { getPersonActions } from '$lib/services/person.service';
  import { locale } from '$lib/stores/preferences.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { createUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { isExternalUrl } from '$lib/utils/navigation';
  import { getPersonFaceThumbnailUrl } from '$lib/utils/people-utils';
  import { isSpaceScopedPerson, toScopedPersonRef } from '$lib/utils/scoped-person-ref';
  import {
    AssetVisibility,
    detachScopedPerson,
    getAllPeople,
    getPersonFaces,
    getPerson,
    mergePerson,
    mergeScopedPeople,
    searchPerson,
    Type2 as ScopedPersonProfileType,
    updateRepresentativeFace,
    updatePerson,
    type PersonFaceResponseDto,
    type PersonResponseDto,
  } from '@immich/sdk';
  import {
    ActionButton,
    CommandPaletteDefaultProvider,
    ContextMenuButton,
    LoadingSpinner,
    modalManager,
    toastManager,
    type ActionItem,
  } from '@immich/ui';
  import { mdiAccountBoxOutline, mdiAccountMultipleCheckOutline, mdiArrowLeft, mdiDotsVertical } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let timelineManager = $state<TimelineManager>() as TimelineManager;
  let numberOfAssets = $derived(timelineManager?.isInitialized ? timelineManager.assetCount : data.statistics.assets);
  const options = $derived({
    visibility: AssetVisibility.Timeline,
    personIds: [data.person.filterId ?? data.person.id],
    withSharedSpaces: true,
  });

  let viewMode: PersonPageViewMode = $state(PersonPageViewMode.VIEW_ASSETS);
  let isEditingName = $state(false);
  let previousRoute = $state<string>(Route.explore());
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

  const getScopedThumbnailUrl = (person: PersonResponseDto, updatedAt?: string): string => {
    const profile = person.primaryProfile;
    if (profile?.type === 'space-person' && profile.spaceId) {
      return createUrl(`/shared-spaces/${profile.spaceId}/people/${profile.id}/thumbnail`, {
        updatedAt: updatedAt ?? person.updatedAt,
      });
    }
    return getPeopleThumbnailUrl(person, updatedAt);
  };

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
        thumbnailData = getScopedThumbnailUrl(person, Date.now().toString());
      }
    });
  });

  const handleEscape = async () => {
    if (assetMultiSelectManager.selectionActive) {
      assetMultiSelectManager.clear();
      return;
    }

    await goto(previousRoute);
    return;
  };

  const updateAssetCount = async () => {
    await invalidateAll();
  };

  afterNavigate(({ from }) => {
    // Prevent setting previousRoute to the current page.
    if (from?.url && from.route.id !== $page.route.id) {
      previousRoute = from.url.href;
    }
  });

  const handleUnmerge = () => {
    timelineManager.removeAssets(assetMultiSelectManager.assets.map((a) => a.id));
    assetMultiSelectManager.clear();
    viewMode = PersonPageViewMode.VIEW_ASSETS;
  };

  const handleReassignAssets = () => {
    viewMode = PersonPageViewMode.UNASSIGN_ASSETS;
  };

  const handleMerge = async (person: PersonResponseDto) => {
    await updateAssetCount();
    await handleGoBack();

    data = { ...data, person };
  };

  const getMergeDisplayName = (person: PersonResponseDto) => person.name;

  const loadMergePeople = async (sortFaces: boolean, person: PersonResponseDto) => {
    const data = await getAllPeople({
      withHidden: false,
      withSharedSpaces: true,
      closestPersonId: sortFaces ? person.id : undefined,
    });
    return data.people;
  };

  const mergePeople = async (targetCandidate: PersonResponseDto, selectedPeople: PersonResponseDto[]) => {
    const targetPerson = person;
    const sourcePeople =
      targetCandidate.id === targetPerson.id
        ? selectedPeople
        : [targetCandidate, ...selectedPeople.filter((selectedPerson) => selectedPerson.id !== targetPerson.id)];
    const usesScopedRepair =
      isSpaceScopedPerson(targetPerson) || sourcePeople.some((sourcePerson) => isSpaceScopedPerson(sourcePerson));
    const mergedCount = await (usesScopedRepair
      ? (async () => {
          await mergeScopedPeople({
            mergeScopedPeopleDto: {
              target: toScopedPersonRef(targetPerson),
              sources: sourcePeople.map((sourcePerson) => toScopedPersonRef(sourcePerson)),
            },
          });
          return sourcePeople.length;
        })()
      : mergePerson({
          id: targetPerson.id,
          mergePersonDto: { ids: sourcePeople.map(({ id }) => id) },
        }).then((results) => results.filter(({ success }) => success).length));
    const mergedPerson = await getPerson({ id: targetPerson.id });
    toastManager.primary($t('merged_people_count', { values: { count: mergedCount } }));
    return mergedPerson;
  };

  const handleSwapMergePerson = async (person: PersonResponseDto) => {
    const profile = person.primaryProfile;
    if (profile?.type === 'space-person' && profile.spaceId) {
      await goto(
        Route.viewSpacePerson(profile.spaceId, profile.id, { previousRoute: Route.people(), action: 'merge' }),
      );
      return;
    }

    await goto(Route.viewPerson(person, { previousRoute: Route.people(), action: 'merge' }));
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

    const [, personToBeMergedInto] = result;

    if (personToBeMergedInto.name != personName && person.id === personToBeMergedInto.id) {
      await updateAssetCount();
      return { merged: true };
    }
    await goto(Route.viewPerson(personToBeMergedInto), { replaceState: true });
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
      toastManager.primary($t('change_name_successfully'));
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
    timelineManager.upsertAssets(assets);
    await updateAssetCount();
  };

  let person = $derived(data.person);

  let thumbnailData = $derived(getScopedThumbnailUrl(person));

  const handleSetVisibility = (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    assetMultiSelectManager.clear();
  };

  const onPersonUpdate = async (response: PersonResponseDto) => {
    if (response.id !== person.id) {
      return;
    }

    if (response.isHidden) {
      await goto(previousRoute);
      return;
    }

    person = response;
  };

  const handlePersonAssetDelete = async ({ id, assetId }: { id: string; assetId: string }) => {
    if (id !== person.id) {
      return;
    }
    timelineManager.removeAssets([assetId]);
    await updateAssetCount();
  };

  const { SetDateOfBirth, Favorite, Unfavorite, HidePerson, ShowPerson } = $derived(getPersonActions($t, person));
  const SelectRepresentativeFace: ActionItem = {
    title: $t('select_representative_face'),
    icon: mdiAccountBoxOutline,
    onAction: async () => {
      const updated = await modalManager.show(RepresentativeFacePickerModal, {
        title: $t('select_representative_face'),
        loadFaces: ({ page, size }: { page: number; size: number }) => getPersonFaces({ id: person.id, page, size }),
        updateFace: async (faceId: string) => {
          person = await updateRepresentativeFace({
            id: person.id,
            representativeFaceUpdateDto: { assetFaceId: faceId },
          });
        },
        getThumbnailUrl: (face: PersonFaceResponseDto) =>
          getPersonFaceThumbnailUrl(person.id, face.id, person.updatedAt),
        canUpdate: true,
      });

      if (updated) {
        thumbnailData = getScopedThumbnailUrl(person, Date.now().toString());
      }
    },
  };

  const Merge: ActionItem = {
    title: $t('merge_people'),
    icon: mdiAccountMultipleCheckOutline,
    onAction: () => {
      viewMode = PersonPageViewMode.MERGE_PEOPLE;
    },
  };

  const SeparateFromGroupedPerson: ActionItem = {
    title: $t('separate_from_grouped_person'),
    icon: mdiAccountMultipleCheckOutline,
    onAction: async () => {
      const isConfirm = await modalManager.showDialog({ prompt: $t('separate_from_grouped_person_prompt') });
      if (!isConfirm) {
        return;
      }

      try {
        await detachScopedPerson({
          detachScopedPersonDto: { profile: { type: ScopedPersonProfileType.Person, id: person.id } },
        });
        await invalidateAll();
        toastManager.primary($t('separate_from_grouped_person'));
      } catch (error) {
        handleError(error, $t('errors.unable_to_save_name'));
      }
    },
  };
</script>

<OnEvents
  {onPersonUpdate}
  onPersonAssetDelete={handlePersonAssetDelete}
  onAssetsDelete={updateAssetCount}
  onAssetsArchive={updateAssetCount}
/>

<main
  class="relative z-0 h-dvh overflow-hidden px-2 md:px-6 md:pt-(--navbar-height-md) pt-(--navbar-height)"
  use:scrollMemoryClearer={{
    routeStartsWith: Route.people(),
    beforeClear: () => {
      sessionStorage.removeItem(SessionStorageKey.INFINITE_SCROLL_PAGE);
    },
  }}
>
  {#key person.id}
    <Timeline
      enableRouting={true}
      {person}
      bind:timelineManager
      {options}
      assetInteraction={assetMultiSelectManager}
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
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {$t('faces_count', { values: { count: data.statistics.faces } })}
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
  {#if assetMultiSelectManager.selectionActive}
    <AssetSelectControlBar>
      {@const Actions = getAssetBulkActions($t)}
      <CommandPaletteDefaultProvider name={$t('assets')} actions={Object.values(Actions)} />
      <CreateSharedLink />
      <SelectAllAssets {timelineManager} assetInteraction={assetMultiSelectManager} />
      <ActionButton action={Actions.AddToAlbum} />
      <FavoriteAction
        removeFavorite={assetMultiSelectManager.isAllFavorite}
        onFavorite={(ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))}
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
          unarchive={assetMultiSelectManager.isAllArchived}
          onArchive={(ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))}
        />
        {#if authManager.preferences.tags.enabled && assetMultiSelectManager.isAllUserOwned}
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
  {:else if viewMode === PersonPageViewMode.VIEW_ASSETS}
    <ControlAppBar showBackButton backIcon={mdiArrowLeft} onClose={() => goto(previousRoute)}>
      {#snippet trailing()}
        <ContextMenuButton
          items={[
            SelectRepresentativeFace,
            HidePerson,
            ShowPerson,
            SetDateOfBirth,
            Merge,
            SeparateFromGroupedPerson,
            Favorite,
            Unfavorite,
          ]}
          aria-label={$t('open')}
        />
      {/snippet}
    </ControlAppBar>
  {/if}
</header>

{#if viewMode === PersonPageViewMode.UNASSIGN_ASSETS}
  <UnMergeFaceSelector
    assetIds={assetMultiSelectManager.assets.map((a) => a.id)}
    personAssets={person}
    onClose={() => (viewMode = PersonPageViewMode.VIEW_ASSETS)}
    onConfirm={handleUnmerge}
  />
{/if}

{#if viewMode === PersonPageViewMode.MERGE_PEOPLE}
  <PeopleMergeSelector
    {person}
    getDisplayName={getMergeDisplayName}
    getThumbnailUrl={getScopedThumbnailUrl}
    loadPeople={loadMergePeople}
    {mergePeople}
    searchPeople={(name) => searchPerson({ name, withHidden: true, withSharedSpaces: true })}
    onBack={handleGoBack}
    onMerge={handleMerge}
    onSwapPerson={handleSwapMergePerson}
  />
{/if}
