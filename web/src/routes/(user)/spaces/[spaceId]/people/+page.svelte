<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { QueryParameter, timeBeforeShowLoadingSpinner } from '$lib/constants';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import PeopleManagementGrid from '$lib/components/people/people-management-grid.svelte';
  import PeopleMergeSelector from '$lib/components/people/people-merge-selector.svelte';
  import type { ManagedPerson } from '$lib/components/people/people-types';
  import ManageSpacePeopleVisibility from '$lib/components/spaces/manage-space-people-visibility.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import PersonEditBirthDateModal from '$lib/modals/PersonEditBirthDateModal.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { createUrl, handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { clearQueryParam } from '$lib/utils/navigation';
  import {
    getSpacePeople,
    getSpacePeopleStatistics,
    mergeSpacePeople,
    SharedSpaceRole,
    updateSpacePerson,
    type SharedSpaceMemberResponseDto,
    type SharedSpacePeopleStatisticsResponseDto,
    type SharedSpacePersonResponseDto,
    type SharedSpaceResponseDto,
  } from '@immich/sdk';
  import { Button, Icon, IconButton, modalManager, toastManager } from '@immich/ui';
  import {
    mdiAccountGroupOutline,
    mdiAccountMultipleCheckOutline,
    mdiCalendarEditOutline,
    mdiArrowLeft,
    mdiDotsVertical,
    mdiEyeOffOutline,
    mdiEyeOutline,
  } from '@mdi/js';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const PAGE_SIZE = 100;

  const space: SharedSpaceResponseDto = $derived(data.space);
  const members: SharedSpaceMemberResponseDto[] = $derived(data.members);
  let people = $state<SharedSpacePersonResponseDto[]>([]);
  let peopleStatistics = $state<SharedSpacePeopleStatisticsResponseDto>({ total: 0, hidden: 0 });
  let loadedSpaceId = $state('');
  let loading = $state(false);
  let hasMore = $state(false);
  let searchName = $state('');
  let showLoadingSpinner = $state(false);
  let abortController: AbortController | null = null;
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  let selectHidden = $state(false);
  const visiblePeople = $derived(people.filter((p) => !p.isHidden));
  const countVisiblePeople = $derived(peopleStatistics.total - peopleStatistics.hidden);
  let allPeople = $state<SharedSpacePersonResponseDto[]>([]);
  let mergingPerson = $state<SharedSpacePersonResponseDto>();

  $effect(() => {
    if (data.space.id !== loadedSpaceId) {
      people = data.people;
      peopleStatistics = data.peopleStatistics;
      hasMore = data.people.length >= PAGE_SIZE;
      mergingPerson = undefined;
      loadedSpaceId = data.space.id;
    }
  });

  const currentMember = $derived(members.find((m) => m.userId === authManager.user.id));
  const isOwner = $derived(currentMember?.role === SharedSpaceRole.Owner);
  const isEditor = $derived(isOwner || currentMember?.role === SharedSpaceRole.Editor);

  onMount(() => {
    const searchedPeople = $page.url.searchParams.get(QueryParameter.SEARCHED_PEOPLE);
    if (searchedPeople) {
      searchName = searchedPeople;
      handlePromiseError(searchPeople(searchedPeople));
    }
  });

  const getThumbUrl = (person: SharedSpacePersonResponseDto): string => {
    return createUrl(`/shared-spaces/${space.id}/people/${person.id}/thumbnail`, { updatedAt: person.updatedAt });
  };

  const toManagedPerson = (person: SharedSpacePersonResponseDto): ManagedPerson => ({
    id: person.id,
    displayName: person.name || '',
    canonicalName: person.name,
    thumbnailUrl: getThumbUrl(person),
    href: `/spaces/${space.id}/people/${person.id}`,
    isHidden: person.isHidden,
    type: person.type,
    assetCount: person.assetCount,
    faceCount: person.faceCount,
  });

  const getPeopleQuery = (query: { limit?: number; offset?: number; withHidden?: boolean } = {}) => {
    const name = searchName.trim();
    return { id: space.id, ...(name ? { name } : {}), ...query };
  };

  const getStatisticsQuery = () => {
    const name = searchName.trim();
    return { id: space.id, ...(name ? { name } : {}) };
  };

  const cancelSearchRequest = () => {
    abortController?.abort();
    abortController = null;
    showLoadingSpinner = false;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
  };

  async function updateSearchQueryParam() {
    const currentSearch = $page.url.searchParams.get(QueryParameter.SEARCHED_PEOPLE) ?? '';
    if (currentSearch === searchName) {
      return;
    }

    if (searchName) {
      $page.url.searchParams.set(QueryParameter.SEARCHED_PEOPLE, searchName);
    } else {
      $page.url.searchParams.delete(QueryParameter.SEARCHED_PEOPLE);
    }

    await goto($page.url, { keepFocus: true });
  }

  async function refreshPeople() {
    try {
      const [newPeople, newStatistics] = await Promise.all([
        getSpacePeople(getPeopleQuery({ limit: PAGE_SIZE })),
        getSpacePeopleStatistics(getStatisticsQuery()),
      ]);
      people = newPeople;
      peopleStatistics = newStatistics;
      hasMore = people.length >= PAGE_SIZE;
    } catch (error) {
      handleError(error, $t('spaces_error_loading_people'));
    }
  }

  async function searchPeople(name?: string) {
    searchName = name ?? searchName;
    await updateSearchQueryParam();

    if (!searchName.trim()) {
      cancelSearchRequest();
      await refreshPeople();
      return;
    }

    cancelSearchRequest();
    const controller = new AbortController();
    abortController = controller;
    searchTimeout = setTimeout(() => (showLoadingSpinner = true), timeBeforeShowLoadingSpinner);

    try {
      const [newPeople, newStatistics] = await Promise.all([
        getSpacePeople(getPeopleQuery({ limit: PAGE_SIZE }), { signal: controller.signal }),
        getSpacePeopleStatistics(getStatisticsQuery(), { signal: controller.signal }),
      ]);

      if (abortController !== controller) {
        return;
      }

      people = newPeople;
      peopleStatistics = newStatistics;
      hasMore = people.length >= PAGE_SIZE;
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      handleError(error, $t('spaces_error_loading_people'));
    } finally {
      if (abortController === controller) {
        abortController = null;
        showLoadingSpinner = false;
      }
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
      }
    }
  }

  async function onResetSearchBar() {
    searchName = '';
    cancelSearchRequest();
    await clearQueryParam(QueryParameter.SEARCHED_PEOPLE, $page.url);
    await refreshPeople();
  }

  async function loadMore() {
    if (loading || !hasMore) {
      return;
    }
    loading = true;
    try {
      const more = await getSpacePeople(getPeopleQuery({ limit: PAGE_SIZE, offset: people.length }));
      people = [...people, ...more];
      hasMore = more.length >= PAGE_SIZE;
    } catch (error) {
      handleError(error, $t('spaces_error_loading_people'));
    } finally {
      loading = false;
    }
  }

  async function openVisibilityModal() {
    try {
      allPeople = await getSpacePeople({ id: space.id, withHidden: true, limit: PAGE_SIZE });
    } catch (error) {
      handleError(error, $t('spaces_error_loading_people'));
      return;
    }
    hasMoreVisibility = allPeople.length >= PAGE_SIZE;
    selectHidden = true;
  }

  let hasMoreVisibility = $state(false);
  let loadingVisibility = $state(false);

  async function loadMoreVisibility() {
    if (loadingVisibility || !hasMoreVisibility) {
      return;
    }
    loadingVisibility = true;
    try {
      const more = await getSpacePeople({
        id: space.id,
        withHidden: true,
        limit: PAGE_SIZE,
        offset: allPeople.length,
      });
      allPeople = [...allPeople, ...more];
      hasMoreVisibility = more.length >= PAGE_SIZE;
    } catch (error) {
      handleError(error, $t('spaces_error_loading_people'));
    } finally {
      loadingVisibility = false;
    }
  }

  const onNameSubmit = async (name: string, person: SharedSpacePersonResponseDto) => {
    try {
      if (name === person.name) {
        return;
      }
      await updateSpacePerson({
        id: space.id,
        personId: person.id,
        sharedSpacePersonUpdateDto: { name },
      });
      await refreshPeople();
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  const getMergeDisplayName = (person: SharedSpacePersonResponseDto) => person.name || '';

  const loadMergePeople = async () => {
    return getSpacePeople({ id: space.id, limit: PAGE_SIZE });
  };

  const mergePeople = async (
    targetPerson: SharedSpacePersonResponseDto,
    selectedPeople: SharedSpacePersonResponseDto[],
  ) => {
    await mergeSpacePeople({
      id: space.id,
      personId: targetPerson.id,
      sharedSpacePersonMergeDto: { ids: selectedPeople.map(({ id }) => id) },
    });
    toastManager.success($t('spaces_people_merged'));
    return targetPerson;
  };

  async function handleMergeComplete() {
    mergingPerson = undefined;
    await refreshPeople();
  }

  async function openBirthDateModal(selectedPerson: SharedSpacePersonResponseDto) {
    const person = people.find(({ id }) => id === selectedPerson.id) ?? selectedPerson;
    await modalManager.show(PersonEditBirthDateModal, {
      birthDate: person.birthDate,
      onSave: async (birthDate) => {
        try {
          const updatedPerson = await updateSpacePerson({
            id: space.id,
            personId: person.id,
            sharedSpacePersonUpdateDto: { birthDate },
          });
          const savedPerson = { ...person, ...updatedPerson, birthDate: updatedPerson.birthDate ?? birthDate };
          people = people.map((currentPerson) => (currentPerson.id === person.id ? savedPerson : currentPerson));
          toastManager.success($t('date_of_birth_saved'));
          return true;
        } catch (error) {
          handleError(error, $t('errors.unable_to_save_date_of_birth'));
          return false;
        }
      },
    });
  }

  async function handleHide(person: SharedSpacePersonResponseDto) {
    try {
      await updateSpacePerson({
        id: space.id,
        personId: person.id,
        sharedSpacePersonUpdateDto: { isHidden: true },
      });
      const idx = people.findIndex((p) => p.id === person.id);
      if (idx !== -1) {
        people[idx] = { ...people[idx], isHidden: true };
      }
      peopleStatistics = { ...peopleStatistics, hidden: peopleStatistics.hidden + 1 };
      toastManager.primary($t('changed_visibility_successfully'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_hide_person'));
    }
  }
</script>

<UserPageLayout
  title={$t('spaces_people_title')}
  description={countVisiblePeople === 0 && !searchName ? undefined : `(${countVisiblePeople.toLocaleString($locale)})`}
>
  {#snippet leading()}
    <IconButton
      variant="ghost"
      shape="round"
      color="secondary"
      aria-label={$t('back')}
      onclick={() => goto(`/spaces/${space.id}`)}
      icon={mdiArrowLeft}
    />
  {/snippet}
  {#snippet buttons()}
    {#if countVisiblePeople > 0 || searchName || (isEditor && peopleStatistics.total > 0)}
      <div class="flex gap-2 items-center justify-center">
        {#if countVisiblePeople > 0 || searchName}
          <div class="hidden sm:block">
            <div class="w-40 lg:w-80 h-10">
              <SearchBar
                bind:name={searchName}
                {showLoadingSpinner}
                placeholder={$t('search_people')}
                onReset={() => void onResetSearchBar()}
                onSearch={() => void searchPeople()}
              />
            </div>
          </div>
        {/if}
        {#if isEditor && peopleStatistics.total > 0}
          <Button
            leadingIcon={mdiEyeOutline}
            onclick={openVisibilityModal}
            size="small"
            variant="ghost"
            color="secondary">{$t('show_and_hide_people')}</Button
          >
        {/if}
      </div>
    {/if}
  {/snippet}

  {#if visiblePeople.length === 0}
    <div class="flex min-h-[calc(66vh-11rem)] w-full place-content-center items-center dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <Icon icon={mdiAccountGroupOutline} size="3.5em" />
        <p class="mt-5 text-lg text-gray-500 dark:text-gray-400">
          {$t(searchName ? 'search_no_people_named' : 'spaces_no_people', { values: { name: searchName } })}
        </p>
        {#if !searchName}
          <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
            {$t('spaces_no_people_description')}
          </p>
        {/if}
      </div>
    </div>
  {:else}
    <div class="px-4 pt-4">
      <PeopleManagementGrid
        people={visiblePeople}
        {toManagedPerson}
        gridClass="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"
        hasNextPage={hasMore}
        {loading}
        loadNextPage={loadMore}
        canEditNames={isEditor}
        canShowActions={isEditor}
        {onNameSubmit}
        deferThumbnails
      >
        {#snippet actions(person)}
          <ButtonContextMenu
            buttonClass="icon-white-drop-shadow"
            color="secondary"
            size="medium"
            variant="filled"
            icon={mdiDotsVertical}
            title={$t('show_person_options')}
          >
            <MenuOption
              onClick={() => void openBirthDateModal(person)}
              icon={mdiCalendarEditOutline}
              text={$t('set_date_of_birth')}
            />
            <MenuOption onClick={() => handleHide(person)} icon={mdiEyeOffOutline} text={$t('hide_person')} />
            <MenuOption
              onClick={() => (mergingPerson = person)}
              icon={mdiAccountMultipleCheckOutline}
              text={$t('merge_people')}
            />
          </ButtonContextMenu>
        {/snippet}
      </PeopleManagementGrid>
    </div>
  {/if}

  {#if mergingPerson}
    <PeopleMergeSelector
      person={mergingPerson}
      getDisplayName={getMergeDisplayName}
      getThumbnailUrl={getThumbUrl}
      loadPeople={loadMergePeople}
      {mergePeople}
      onBack={() => (mergingPerson = undefined)}
      onMerge={() => void handleMergeComplete()}
      showSimilaritySort={false}
      loadErrorMessage={$t('spaces_error_loading_people')}
      mergeErrorMessage={$t('spaces_error_merging_people')}
    />
  {/if}
</UserPageLayout>

{#if selectHidden}
  <dialog
    transition:fly={{ y: 500, duration: 150, easing: quintOut, opacity: 0 }}
    class="fixed inset-0 h-full w-full max-w-none max-h-none bg-light"
    aria-labelledby="manage-visibility-title"
    {@attach (dialog) => dialog.showModal()}
  >
    <ManageSpacePeopleVisibility
      people={allPeople}
      spaceId={space.id}
      onClose={() => (selectHidden = false)}
      onUpdate={() => refreshPeople()}
      hasMore={hasMoreVisibility}
      loading={loadingVisibility}
      onLoadMore={loadMoreVisibility}
    />
  </dialog>
{/if}
