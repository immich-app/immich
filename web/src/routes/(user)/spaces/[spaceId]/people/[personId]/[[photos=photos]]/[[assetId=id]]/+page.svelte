<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { clickOutside } from '$lib/actions/click-outside';
  import { listNavigation } from '$lib/actions/list-navigation';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import PeopleMergeSelector from '$lib/components/people/people-merge-selector.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import RemoveFromSpaceAction from '$lib/components/timeline/actions/RemoveFromSpaceAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import PersonEditBirthDateModal from '$lib/modals/PersonEditBirthDateModal.svelte';
  import RepresentativeFacePickerModal from '$lib/modals/RepresentativeFacePickerModal.svelte';
  import { Route } from '$lib/route';
  import { createUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { locale } from '$lib/stores/preferences.store';
  import { getSpacePersonFaceThumbnailUrl } from '$lib/utils/people-utils';
  import { toScopedPersonRef as toPersonScopedRef } from '$lib/utils/scoped-person-ref';
  import {
    detachScopedPerson,
    getSpacePersonFaces,
    getSpacePeople,
    mergeSpacePeople,
    mergeScopedPeople,
    RepresentativeFaceSource,
    searchPerson,
    SharedSpaceRole,
    Type2 as ScopedPersonProfileType,
    updateSpacePersonRepresentativeFace,
    updateSpacePerson,
    type PersonFaceResponseDto,
    type PersonResponseDto,
    type PersonStatisticsResponseDto,
    type ScopedPersonProfileRefDto,
    type SharedSpaceMemberResponseDto,
    type SharedSpacePersonResponseDto,
  } from '@immich/sdk';
  import { ContextMenuButton, LoadingSpinner, modalManager, toastManager, type ActionItem } from '@immich/ui';
  import {
    mdiAccountBoxOutline,
    mdiAccountMultipleCheckOutline,
    mdiArrowLeft,
    mdiCalendarEditOutline,
    mdiDotsVertical,
    mdiEyeOffOutline,
  } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { tick } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const PAGE_SIZE = 100;

  const space = $derived(data.space);
  const members: SharedSpaceMemberResponseDto[] = $derived(data.members);
  const routeStateKey = $derived(`${data.space.id}:${data.person.id}:${data.person.updatedAt}:${data.action ?? ''}`);

  let timelineManager = $state<TimelineManager>() as TimelineManager;
  let personOverride = $state<SharedSpacePersonResponseDto>();
  let personOverrideKey = $state('');
  const person = $derived(personOverrideKey === routeStateKey && personOverride ? personOverride : data.person);
  let statisticsOverride = $state<PersonStatisticsResponseDto>();
  let statisticsOverrideKey = $state('');
  const statistics = $derived(
    statisticsOverrideKey === routeStateKey && statisticsOverride ? statisticsOverride : data.statistics,
  );
  const previousRoute = $derived(data.previousRoute ?? `/spaces/${space.id}/people`);
  const previousRouteParams = $derived(data.previousRoute ? { previousRoute: data.previousRoute } : undefined);
  let isEditingName = $state(false);
  let editedName = $state('');
  let nameInput = $state<HTMLInputElement>();
  let suggestedPeople: SharedSpacePersonResponseDto[] = $state([]);
  let isSearchingPeople = $state(false);
  let suggestionContainer: HTMLElement | undefined = $state();
  let abortController: AbortController | null = null;
  let loadingTimeout: NodeJS.Timeout | null = null;

  type ScopedMergeCandidate = SharedSpacePersonResponseDto | PersonResponseDto;

  let actionOverride = $state<string | null>();
  let actionOverrideKey = $state('');
  const action = $derived(actionOverrideKey === routeStateKey ? actionOverride : data.action);

  const options = $derived({
    spaceId: space.id,
    spacePersonId: person.id,
    withStacked: true,
  });

  const currentMember = $derived(members.find((member) => member.userId === authManager.user.id));
  const isEditor = $derived(
    currentMember?.role === SharedSpaceRole.Owner || currentMember?.role === SharedSpaceRole.Editor,
  );
  const getSpacePersonRoute = (personId: string) => Route.viewSpacePerson(space.id, personId, previousRouteParams);
  const thumbnailUrl = $derived(
    createUrl(`/shared-spaces/${space.id}/people/${person.id}/thumbnail`, { updatedAt: person.updatedAt }),
  );

  const setPerson = (updatedPerson: SharedSpacePersonResponseDto) => {
    personOverride = updatedPerson;
    personOverrideKey = routeStateKey;
  };

  const setStatistics = (updatedStatistics: PersonStatisticsResponseDto) => {
    statisticsOverride = updatedStatistics;
    statisticsOverrideKey = routeStateKey;
  };

  const setAction = (updatedAction: string | null) => {
    actionOverride = updatedAction;
    actionOverrideKey = routeStateKey;
  };

  const startEditingName = () => {
    if (!isEditor) {
      return;
    }
    editedName = person.name;
    suggestedPeople = [];
    isEditingName = true;
    void tick().then(() => nameInput?.focus());
  };

  const cancelPreviousSearch = () => {
    abortController?.abort();
    abortController = null;
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    isSearchingPeople = false;
  };

  const cancelEditingName = () => {
    cancelPreviousSearch();
    suggestedPeople = [];
    editedName = person.name;
    isEditingName = false;
  };

  const searchSpacePeople = async () => {
    cancelPreviousSearch();
    suggestedPeople = [];

    if (editedName === '') {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => (isSearchingPeople = true), timeBeforeShowLoadingSpinner);
    abortController = controller;
    loadingTimeout = timeout;

    try {
      const people = await getSpacePeople(
        { id: space.id, name: editedName, named: true, limit: 5 },
        { signal: controller.signal },
      );
      suggestedPeople = people.filter((suggestedPerson) => suggestedPerson.id !== person.id);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      handleError(error, $t('errors.cant_search_people'));
    } finally {
      if (loadingTimeout === timeout) {
        clearTimeout(timeout);
        loadingTimeout = null;
      }
      if (abortController === controller) {
        abortController = null;
        isSearchingPeople = false;
      }
    }
  };

  const saveName = async () => {
    if (!isEditingName) {
      return;
    }

    isEditingName = false;
    cancelPreviousSearch();
    suggestedPeople = [];
    if (editedName === person.name) {
      return;
    }

    try {
      const updatedPerson = await updateSpacePerson({
        id: space.id,
        personId: person.id,
        sharedSpacePersonUpdateDto: { name: editedName },
      });
      setPerson({ ...person, ...updatedPerson, name: updatedPerson.name ?? editedName });
      toastManager.success($t('change_name_successfully'));
    } catch (error) {
      editedName = person.name;
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  const selectSuggestedPerson = async (suggestedPerson: SharedSpacePersonResponseDto) => {
    cancelPreviousSearch();
    suggestedPeople = [];

    const isConfirm = await modalManager.showDialog({ prompt: $t('merge_people_prompt') });
    if (!isConfirm) {
      return;
    }

    try {
      await mergeSpacePeople({
        id: space.id,
        personId: suggestedPerson.id,
        sharedSpacePersonMergeDto: { ids: [person.id] },
      });
      toastManager.success($t('spaces_people_merged'));
      await invalidateAll();
      await goto(getSpacePersonRoute(suggestedPerson.id), { replaceState: true });
    } catch (error) {
      handleError(error, $t('cannot_merge_people'));
    } finally {
      isEditingName = false;
    }
  };

  const getThumbUrl = (person: SharedSpacePersonResponseDto): string => {
    return createUrl(`/shared-spaces/${space.id}/people/${person.id}/thumbnail`, { updatedAt: person.updatedAt });
  };

  const isSharedSpacePerson = (person: ScopedMergeCandidate): person is SharedSpacePersonResponseDto =>
    'assetCount' in person;

  const toScopedPersonRef = (person: ScopedMergeCandidate, fallbackSpaceId = space.id): ScopedPersonProfileRefDto => {
    if (!isSharedSpacePerson(person)) {
      return toPersonScopedRef(person);
    }

    return { type: ScopedPersonProfileType.SpacePerson, id: person.id, spaceId: person.spaceId ?? fallbackSpaceId };
  };

  const getMergeDisplayName = (person: ScopedMergeCandidate) => person.name || '';

  const getMergeThumbnailUrl = (person: ScopedMergeCandidate): string => {
    if (isSharedSpacePerson(person)) {
      return createUrl(`/shared-spaces/${person.spaceId ?? space.id}/people/${person.id}/thumbnail`, {
        updatedAt: person.updatedAt,
      });
    }

    const profile = person.primaryProfile;
    if (profile?.type === 'space-person' && profile.spaceId) {
      return createUrl(`/shared-spaces/${profile.spaceId}/people/${profile.id}/thumbnail`, {
        updatedAt: person.updatedAt,
      });
    }

    return getPeopleThumbnailUrl(person);
  };

  const loadMergePeople = async () => {
    return getSpacePeople({ id: space.id, limit: PAGE_SIZE });
  };

  const mergePeople = async (targetPerson: ScopedMergeCandidate, selectedPeople: ScopedMergeCandidate[]) => {
    const targetRef = toScopedPersonRef(targetPerson);
    const sourceRefs = selectedPeople.map((person) => toScopedPersonRef(person));
    const canUseSameSpaceMerge =
      targetRef.type === ScopedPersonProfileType.SpacePerson &&
      targetRef.spaceId === space.id &&
      sourceRefs.every((ref) => ref.type === ScopedPersonProfileType.SpacePerson && ref.spaceId === space.id);

    await (canUseSameSpaceMerge
      ? mergeSpacePeople({
          id: space.id,
          personId: targetRef.id,
          sharedSpacePersonMergeDto: { ids: selectedPeople.map(({ id }) => id) },
        })
      : mergeScopedPeople({
          mergeScopedPeopleDto: {
            target: targetRef,
            sources: sourceRefs,
          },
        }));

    toastManager.success($t('spaces_people_merged'));
    return person;
  };

  const handleBack = async () => {
    if (assetMultiSelectManager.selectionActive) {
      assetMultiSelectManager.clear();
      return;
    }

    await goto(previousRoute);
  };

  const handleRemoveAssets = async (assetIds: string[]) => {
    const removedAssetCount = new Set(assetIds).size;
    timelineManager.removeAssets(assetIds);
    setPerson({ ...person, assetCount: Math.max(0, person.assetCount - removedAssetCount) });
    setStatistics({ ...statistics, assets: Math.max(0, statistics.assets - removedAssetCount) });
    await invalidateAll();
  };

  async function closeMergeFlow() {
    setAction(null);
    if (data.action === 'merge') {
      await goto(getSpacePersonRoute(person.id), { replaceState: true });
    }
  }

  async function handleMergeComplete(updatedPerson: ScopedMergeCandidate) {
    if (isSharedSpacePerson(updatedPerson)) {
      setPerson(updatedPerson);
    }
    setAction(null);
    await invalidateAll();
  }

  async function openBirthDateModal() {
    await modalManager.show(PersonEditBirthDateModal, {
      birthDate: person.birthDate,
      onSave: async (birthDate) => {
        try {
          const updatedPerson = await updateSpacePerson({
            id: space.id,
            personId: person.id,
            sharedSpacePersonUpdateDto: { birthDate },
          });
          setPerson({ ...person, ...updatedPerson, birthDate: updatedPerson.birthDate ?? birthDate });
          toastManager.success($t('date_of_birth_saved'));
          return true;
        } catch (error) {
          handleError(error, $t('errors.unable_to_save_date_of_birth'));
          return false;
        }
      },
    });
  }

  async function openRepresentativeFacePicker() {
    const updated = await modalManager.show(RepresentativeFacePickerModal, {
      title: $t('select_representative_face'),
      loadFaces: ({ page, size }: { page: number; size: number }) =>
        getSpacePersonFaces({ id: space.id, personId: person.id, page, size }),
      updateFace: async (faceId: string) => {
        const updatedPerson = await updateSpacePersonRepresentativeFace({
          id: space.id,
          personId: person.id,
          spaceRepresentativeFaceUpdateDto: { assetFaceId: faceId },
        });
        setPerson({ ...person, ...updatedPerson });
      },
      resetFace:
        person.representativeFaceSource === RepresentativeFaceSource.Manual
          ? async () => {
              const updatedPerson = await updateSpacePersonRepresentativeFace({
                id: space.id,
                personId: person.id,
                spaceRepresentativeFaceUpdateDto: { assetFaceId: null },
              });
              setPerson({ ...person, ...updatedPerson });
            }
          : undefined,
      getThumbnailUrl: (face: PersonFaceResponseDto) =>
        getSpacePersonFaceThumbnailUrl(space.id, person.id, face.id, person.updatedAt),
      canUpdate: isEditor,
    });

    if (updated) {
      await invalidateAll();
    }
  }

  async function handleHidePerson() {
    try {
      await updateSpacePerson({
        id: space.id,
        personId: person.id,
        sharedSpacePersonUpdateDto: { isHidden: true },
      });
      toastManager.primary($t('changed_visibility_successfully'));
      await goto(`/spaces/${space.id}/people`);
    } catch (error) {
      handleError(error, $t('errors.unable_to_hide_person'));
    }
  }

  async function handleDetachProfile() {
    const isConfirm = await modalManager.showDialog({ prompt: $t('separate_from_grouped_person_prompt') });
    if (!isConfirm) {
      return;
    }

    try {
      await detachScopedPerson({
        detachScopedPersonDto: {
          profile: { type: ScopedPersonProfileType.SpacePerson, id: person.id, spaceId: space.id },
        },
      });
      toastManager.success($t('separate_from_grouped_person'));
      await invalidateAll();
    } catch (error) {
      handleError(error, $t('spaces_error_merging_people'));
    }
  }

  const actionItems = $derived.by(() => {
    const items: ActionItem[] = [];

    if (isEditor) {
      items.push(
        {
          title: $t('select_representative_face'),
          icon: mdiAccountBoxOutline,
          onAction: () => void openRepresentativeFacePicker(),
        },
        {
          title: $t('set_date_of_birth'),
          icon: mdiCalendarEditOutline,
          onAction: () => void openBirthDateModal(),
        },
        {
          title: $t('hide_person'),
          icon: mdiEyeOffOutline,
          $if: () => !person.isHidden,
          onAction: () => void handleHidePerson(),
        },
        {
          title: $t('merge_people'),
          icon: mdiAccountMultipleCheckOutline,
          onAction: () => setAction('merge'),
        },
        {
          title: $t('separate_from_grouped_person'),
          icon: mdiAccountMultipleCheckOutline,
          onAction: () => void handleDetachProfile(),
        },
      );
    }

    return items;
  });
</script>

<main class="relative z-0 h-dvh overflow-hidden px-2 pt-(--navbar-height) md:px-6 md:pt-(--navbar-height-md)">
  {#key person.id}
    <Timeline
      enableRouting={true}
      bind:timelineManager
      {options}
      assetInteraction={assetMultiSelectManager}
      onEscape={handleBack}
      spaceId={space.id}
    >
      <div
        class="relative w-fit p-4 pt-12 sm:px-6"
        use:clickOutside={{
          onOutclick: () => void saveName(),
          onEscape: cancelEditingName,
        }}
        use:listNavigation={suggestionContainer}
      >
        <section class="flex w-64 place-items-center border-black sm:w-96">
          {#if isEditor}
            <button
              type="button"
              class="relative flex items-center justify-center text-start"
              aria-label={$t('edit_name')}
              onclick={startEditingName}
            >
              <ImageThumbnail
                circle
                shadow
                url={thumbnailUrl}
                altText={person.name}
                widthStyle="3.375rem"
                heightStyle="3.375rem"
              />
            </button>
          {:else}
            <div class="relative flex items-center justify-center">
              <ImageThumbnail
                circle
                shadow
                url={thumbnailUrl}
                altText={person.name}
                widthStyle="3.375rem"
                heightStyle="3.375rem"
              />
            </div>
          {/if}
          <div class="flex flex-col justify-center px-4 text-start text-primary">
            {#if isEditingName}
              <input
                bind:this={nameInput}
                bind:value={editedName}
                class="w-40 rounded-lg bg-gray-100 px-2 py-1 font-medium text-primary outline-hidden focus:ring-2 focus:ring-immich-primary dark:bg-immich-dark-gray dark:focus:ring-immich-dark-primary sm:w-72"
                placeholder={$t('add_a_name')}
                aria-label={$t('edit_name')}
                oninput={() => void searchSpacePeople()}
                onkeydown={(event) => {
                  if (event.key === 'Enter') {
                    void saveName();
                  }
                  if (event.key === 'Escape') {
                    cancelEditingName();
                  }
                }}
              />
            {:else if isEditor}
              <button
                type="button"
                class="w-40 truncate text-start font-medium sm:w-72"
                aria-label={$t('edit_name')}
                onclick={startEditingName}
              >
                {person.name || $t('add_a_name')}
              </button>
            {:else}
              <p class="w-40 truncate font-medium sm:w-72">{person.name || $t('add_a_name')}</p>
            {/if}
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {$t('assets_count', { values: { count: statistics.assets } })}
            </p>
            {#if featureFlagsManager.value.peopleStatistics}
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {$t('faces_count', { values: { count: statistics.faces } })}
              </p>
            {/if}
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
        </section>
        {#if isEditingName}
          <div class="absolute z-1 w-64 sm:w-96">
            {#if isSearchingPeople}
              <div
                class="flex h-14 place-items-center rounded-b-lg border border-gray-400 bg-gray-200 p-2 dark:border-immich-dark-gray dark:bg-gray-700"
              >
                <div class="flex w-full place-items-center">
                  <LoadingSpinner />
                </div>
              </div>
            {:else}
              <div bind:this={suggestionContainer}>
                {#each suggestedPeople as suggestedPerson, index (suggestedPerson.id)}
                  <button
                    type="button"
                    class="flex h-14 w-full place-items-center border border-gray-200 bg-gray-100 p-2 hover:bg-gray-300 focus:bg-gray-300 dark:border-immich-dark-gray dark:bg-gray-700 hover:dark:bg-[#232932] focus:dark:bg-[#232932] {index ===
                    suggestedPeople.length - 1
                      ? 'rounded-b-lg border-b'
                      : ''}"
                    aria-label={suggestedPerson.name}
                    onclick={() => void selectSuggestedPerson(suggestedPerson)}
                  >
                    <ImageThumbnail
                      circle
                      shadow
                      url={getThumbUrl(suggestedPerson)}
                      altText={suggestedPerson.name}
                      widthStyle="2rem"
                      heightStyle="2rem"
                    />
                    <p class="ms-4 text-gray-700 dark:text-gray-100">{suggestedPerson.name}</p>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      {#snippet empty()}
        <div class="mx-auto max-w-md py-16 text-center">
          <p class="text-gray-500 dark:text-gray-400">{$t('spaces_no_person_assets')}</p>
        </div>
      {/snippet}
    </Timeline>
  {/key}
</main>

<header>
  {#if assetMultiSelectManager.selectionActive}
    <AssetSelectControlBar>
      <SelectAllAssets {timelineManager} assetInteraction={assetMultiSelectManager} />
      {#if isEditor}
        <RemoveFromSpaceAction spaceId={space.id} onRemove={handleRemoveAssets} />
      {/if}
      {#if assetMultiSelectManager.isAllUserOwned}
        <FavoriteAction
          removeFavorite={assetMultiSelectManager.isAllFavorite}
          onFavorite={(ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))}
        />
      {/if}
      <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')} offset={{ x: 175, y: 25 }}>
        <DownloadAction menuItem filename="{person.name || space.name || 'immich'}.zip" />
        {#if assetMultiSelectManager.isAllUserOwned}
          <ChangeDate menuItem />
          <ChangeDescription menuItem />
          <ChangeLocation menuItem />
          <ArchiveAction
            menuItem
            unarchive={assetMultiSelectManager.isAllArchived}
            onArchive={(ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))}
          />
        {/if}
        {#if authManager.preferences.tags.enabled && assetMultiSelectManager.isAllUserOwned}
          <TagAction menuItem />
        {/if}
      </ButtonContextMenu>
    </AssetSelectControlBar>
  {:else}
    <ControlAppBar showBackButton backIcon={mdiArrowLeft} onClose={handleBack}>
      {#snippet trailing()}
        {#if isEditor && action !== 'merge'}
          <ContextMenuButton items={actionItems} aria-label={$t('show_person_options')} />
        {/if}
      {/snippet}
    </ControlAppBar>
  {/if}
</header>

{#if isEditor && action === 'merge'}
  <PeopleMergeSelector
    {person}
    getDisplayName={getMergeDisplayName}
    getThumbnailUrl={getMergeThumbnailUrl}
    loadPeople={loadMergePeople}
    {mergePeople}
    searchPeople={(name) => searchPerson({ name, withHidden: true, withSharedSpaces: true })}
    onBack={() => void closeMergeFlow()}
    onMerge={(mergedPerson) => void handleMergeComplete(mergedPerson)}
    showSimilaritySort={false}
    loadErrorMessage={$t('spaces_error_loading_people')}
    mergeErrorMessage={$t('spaces_error_merging_people')}
  />
{/if}
