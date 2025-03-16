<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { focusTrap } from '$lib/actions/focus-trap';
  import { scrollMemory } from '$lib/actions/scroll-memory';
  import Icon from '$lib/components/elements/icon.svelte';
  import ManagePeopleVisibility from '$lib/components/faces-page/manage-people-visibility.svelte';
  import MergeSuggestionModal from '$lib/components/faces-page/merge-suggestion-modal.svelte';
  import PeopleCard from '$lib/components/faces-page/people-card.svelte';
  import PeopleInfiniteScroll from '$lib/components/faces-page/people-infinite-scroll.svelte';
  import SearchPeople from '$lib/components/faces-page/people-search.svelte';
  import SetBirthDateModal from '$lib/components/faces-page/set-birth-date-modal.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { ActionQueryParameterValue, AppRoute, QueryParameter, SessionStorageKey } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { clearQueryParam } from '$lib/utils/navigation';
  import {
    getAllPeople,
    getPerson,
    mergePerson,
    searchPerson,
    updatePerson,
    type PersonResponseDto,
  } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiAccountOff, mdiEyeOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let selectHidden = $state(false);
  let searchName = $state('');
  let showSetBirthDateModal = $state(false);
  let showMergeModal = $state(false);
  let newName = $state('');
  let currentPage = $state(1);
  let nextPage = $state(data.people.hasNextPage ? 2 : null);
  let personMerge1 = $state<PersonResponseDto>();
  let personMerge2 = $state<PersonResponseDto>();
  let potentialMergePeople: PersonResponseDto[] = $state([]);
  let edittingPerson: PersonResponseDto | null = $state(null);
  let searchedPeopleLocal: PersonResponseDto[] = $state([]);
  let innerHeight = $state(0);
  let searchPeopleElement = $state<ReturnType<typeof SearchPeople>>();

  onMount(() => {
    const getSearchedPeople = $page.url.searchParams.get(QueryParameter.SEARCHED_PEOPLE);
    if (getSearchedPeople) {
      searchName = getSearchedPeople;
      if (searchPeopleElement) {
        handlePromiseError(searchPeopleElement.searchPeople(true, searchName));
      }
    }

    return websocketEvents.on('on_person_thumbnail', (personId: string) => {
      for (const person of people) {
        if (person.id === personId) {
          person.updatedAt = new Date().toISOString();
        }
      }
    });
  });

  const loadInitialScroll = () =>
    new Promise<void>((resolve) => {
      // Load up to previously loaded page when returning.
      let newNextPage = sessionStorage.getItem(SessionStorageKey.INFINITE_SCROLL_PAGE);
      if (newNextPage && nextPage) {
        let startingPage = nextPage,
          pagesToLoad = Number.parseInt(newNextPage) - nextPage;

        if (pagesToLoad) {
          handlePromiseError(
            Promise.all(
              Array.from({ length: pagesToLoad }).map((_, i) => {
                return getAllPeople({ withHidden: true, page: startingPage + i });
              }),
            ).then((pages) => {
              for (const page of pages) {
                people = people.concat(page.people);
              }
              currentPage = startingPage + pagesToLoad - 1;
              nextPage = pages.at(-1)?.hasNextPage ? startingPage + pagesToLoad : null;
              resolve(); // wait until extra pages are loaded
            }),
          );
        } else {
          resolve();
        }
        sessionStorage.removeItem(SessionStorageKey.INFINITE_SCROLL_PAGE);
      }
    });

  const loadNextPage = async () => {
    if (!nextPage) {
      return;
    }

    try {
      const { people: newPeople, hasNextPage } = await getAllPeople({ withHidden: true, page: nextPage });
      people = people.concat(newPeople);
      if (nextPage !== null) {
        currentPage = nextPage;
      }
      nextPage = hasNextPage ? nextPage + 1 : null;
    } catch (error) {
      handleError(error, $t('errors.failed_to_load_people'));
    }
  };

  const handleSearch = async () => {
    const getSearchedPeople = $page.url.searchParams.get(QueryParameter.SEARCHED_PEOPLE);
    if (getSearchedPeople !== searchName) {
      $page.url.searchParams.set(QueryParameter.SEARCHED_PEOPLE, searchName);
      await goto($page.url, { keepFocus: true });
    }
  };

  const handleMergeSamePerson = async (response: [PersonResponseDto, PersonResponseDto]) => {
    const [personToMerge, personToBeMergedIn] = response;
    showMergeModal = false;

    if (!edittingPerson) {
      return;
    }
    try {
      await mergePerson({
        id: personToBeMergedIn.id,
        mergePersonDto: { ids: [personToMerge.id] },
      });

      const mergedPerson = await getPerson({ id: personToBeMergedIn.id });

      people = people.filter((person: PersonResponseDto) => person.id !== personToMerge.id);
      people = people.map((person: PersonResponseDto) => (person.id === personToBeMergedIn.id ? mergedPerson : person));
      notificationController.show({
        message: $t('merge_people_successfully'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
    if (personToBeMergedIn.name !== newName && edittingPerson.id === personToBeMergedIn.id) {
      /*
       *
       * If the user merges one of the suggested people into the person he's editing it, it's merging the suggested person AND renames
       * the person he's editing
       *
       */
      try {
        await updatePerson({ id: personToBeMergedIn.id, personUpdateDto: { name: newName } });

        for (const person of people) {
          if (person.id === personToBeMergedIn.id) {
            person.name = newName;
            break;
          }
        }
        notificationController.show({
          message: $t('change_name_successfully'),
          type: NotificationType.Info,
        });
      } catch (error) {
        handleError(error, $t('errors.unable_to_save_name'));
      }
    }
  };

  const handleSetBirthDate = (detail: PersonResponseDto) => {
    showSetBirthDateModal = true;
    edittingPerson = detail;
  };

  const handleHidePerson = async (detail: PersonResponseDto) => {
    try {
      const updatedPerson = await updatePerson({
        id: detail.id,
        personUpdateDto: { isHidden: true },
      });

      people = people.map((person: PersonResponseDto) => {
        if (person.id === updatedPerson.id) {
          return updatedPerson;
        }
        return person;
      });

      notificationController.show({
        message: $t('changed_visibility_successfully'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_hide_person'));
    }
  };

  const handleToggleFavorite = async (detail: PersonResponseDto) => {
    try {
      const updatedPerson = await updatePerson({
        id: detail.id,
        personUpdateDto: { isFavorite: !detail.isFavorite },
      });

      const index = people.findIndex((person) => person.id === detail.id);
      people[index] = updatedPerson;

      notificationController.show({
        message: updatedPerson.isFavorite ? $t('added_to_favorites') : $t('removed_from_favorites'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: detail.isFavorite } }));
    }
  };

  const handleMergePeople = async (detail: PersonResponseDto) => {
    await goto(
      `${AppRoute.PEOPLE}/${detail.id}?${QueryParameter.ACTION}=${ActionQueryParameterValue.MERGE}&${QueryParameter.PREVIOUS_ROUTE}=${AppRoute.PEOPLE}`,
    );
  };

  const submitBirthDateChange = async (value: string) => {
    showSetBirthDateModal = false;
    if (!edittingPerson || value === edittingPerson.birthDate) {
      return;
    }

    try {
      const updatedPerson = await updatePerson({
        id: edittingPerson.id,
        personUpdateDto: { birthDate: value.length > 0 ? value : null },
      });

      people = people.map((person: PersonResponseDto) => {
        if (person.id === updatedPerson.id) {
          return updatedPerson;
        }
        return person;
      });
      notificationController.show({
        message: $t('birthdate_saved'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  const onResetSearchBar = async () => {
    await clearQueryParam(QueryParameter.SEARCHED_PEOPLE, $page.url);
  };

  let people = $state(data.people.people);
  $effect(() => {
    people = data.people.people;
  });
  let visiblePeople = $derived(people.filter((people) => !people.isHidden));
  let countVisiblePeople = $derived(searchName ? searchedPeopleLocal.length : data.people.total - data.people.hidden);
  let showPeople = $derived(searchName ? searchedPeopleLocal : visiblePeople);

  const onNameChangeInputFocus = (person: PersonResponseDto) => {
    edittingPerson = person;
    newName = person.name;
  };

  const onNameChangeSubmit = async (name: string, targetPerson: PersonResponseDto) => {
    try {
      if (name == targetPerson.name || showMergeModal) {
        return;
      }

      if (name === '') {
        await updateName(targetPerson.id, '');
        return;
      }

      const personWithSimilarName = await findPeopleWithSimilarName(name, targetPerson.id);
      if (personWithSimilarName) {
        personMerge1 = targetPerson;
        personMerge2 = personWithSimilarName;
        potentialMergePeople = people
          .filter(
            (person: PersonResponseDto) =>
              personMerge2?.name.toLowerCase() === person.name.toLowerCase() &&
              person.id !== personMerge2.id &&
              person.id !== personMerge1?.id &&
              !person.isHidden,
          )
          .slice(0, 3);
        showMergeModal = true;
        return;
      }
      await updateName(targetPerson.id, name);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  const onNameChangeInputUpdate = (event: Event) => {
    if (event.target) {
      newName = (event.target as HTMLInputElement).value;
    }
  };

  const updateName = async (id: string, name: string) => {
    await updatePerson({
      id,
      personUpdateDto: { name },
    });

    newName = '';
  };

  const findPeopleWithSimilarName = async (name: string, personId: string) => {
    const searchResult = await searchPerson({ name, withHidden: true });
    return searchResult.find(
      (person) => person.name.toLowerCase() === name.toLowerCase() && person.id !== personId && person.name,
    );
  };

  const handleMergeCancel = async () => {
    if (!personMerge1) {
      return;
    }

    await updateName(personMerge1.id, newName);
    showMergeModal = false;
  };
</script>

<svelte:window bind:innerHeight />

{#if showMergeModal && personMerge1 && personMerge2}
  <MergeSuggestionModal
    {personMerge1}
    {personMerge2}
    {potentialMergePeople}
    onClose={() => {
      showMergeModal = false;
    }}
    onReject={() => handleMergeCancel()}
    onConfirm={handleMergeSamePerson}
  />
{/if}

<UserPageLayout
  title={$t('people')}
  description={countVisiblePeople === 0 && !searchName ? undefined : `(${countVisiblePeople.toLocaleString($locale)})`}
  use={[
    [
      scrollMemory,
      {
        routeStartsWith: AppRoute.PEOPLE,
        beforeSave: () => {
          if (currentPage) {
            sessionStorage.setItem(SessionStorageKey.INFINITE_SCROLL_PAGE, currentPage.toString());
          }
        },
        beforeClear: () => {
          sessionStorage.removeItem(SessionStorageKey.INFINITE_SCROLL_PAGE);
        },
        beforeLoad: loadInitialScroll,
      },
    ],
  ]}
>
  {#snippet buttons()}
    {#if people.length > 0}
      <div class="flex gap-2 items-center justify-center">
        <div class="hidden sm:block">
          <div class="w-40 lg:w-80 h-10">
            <SearchPeople
              bind:this={searchPeopleElement}
              type="searchBar"
              placeholder={$t('search_people')}
              onReset={onResetSearchBar}
              onSearch={handleSearch}
              bind:searchName
              bind:searchedPeopleLocal
            />
          </div>
        </div>
        <Button
          leadingIcon={mdiEyeOutline}
          onclick={() => (selectHidden = !selectHidden)}
          size="small"
          variant="ghost"
          color="secondary">{$t('show_and_hide_people')}</Button
        >
      </div>
    {/if}
  {/snippet}

  {#if countVisiblePeople > 0 && (!searchName || searchedPeopleLocal.length > 0)}
    <PeopleInfiniteScroll people={showPeople} hasNextPage={!!nextPage && !searchName} {loadNextPage}>
      {#snippet children({ person, index })}
        <div
          class="p-2 rounded-xl hover:bg-gray-200 border-2 hover:border-immich-primary/50 hover:shadow-sm dark:hover:bg-immich-dark-primary/20 hover:dark:border-immich-dark-primary/25 border-transparent transition-all"
        >
          <PeopleCard
            {person}
            preload={index < 20}
            onSetBirthDate={() => handleSetBirthDate(person)}
            onMergePeople={() => handleMergePeople(person)}
            onHidePerson={() => handleHidePerson(person)}
            onToggleFavorite={() => handleToggleFavorite(person)}
          />

          <form onsubmit={() => onNameChangeSubmit(newName, person)}>
            <input
              type="text"
              class=" bg-white dark:bg-immich-dark-gray border-gray-100 placeholder-gray-400 text-center dark:border-gray-900 w-full rounded-2xl mt-2 py-2 text-sm text-immich-primary dark:text-immich-dark-primary"
              value={person.name}
              placeholder={$t('add_a_name')}
              onfocusin={() => onNameChangeInputFocus(person)}
              onfocusout={() => onNameChangeSubmit(newName, person)}
              oninput={(event) => onNameChangeInputUpdate(event)}
            />
          </form>
        </div>
      {/snippet}
    </PeopleInfiniteScroll>
  {:else}
    <div class="flex min-h-[calc(66vh_-_11rem)] w-full place-content-center items-center dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <Icon path={mdiAccountOff} size="3.5em" />
        <p class="mt-5 text-3xl font-medium max-w-lg line-clamp-2 overflow-hidden">
          {$t(searchName ? 'search_no_people_named' : 'search_no_people', { values: { name: searchName } })}
        </p>
      </div>
    </div>
  {/if}

  {#if showSetBirthDateModal}
    <SetBirthDateModal
      birthDate={edittingPerson?.birthDate ?? ''}
      onClose={() => (showSetBirthDateModal = false)}
      onUpdate={submitBirthDateChange}
    />
  {/if}
</UserPageLayout>

{#if selectHidden}
  <div
    transition:fly={{ y: innerHeight, duration: 150, easing: quintOut, opacity: 0 }}
    class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
    role="dialog"
    aria-modal="true"
    aria-labelledby="manage-visibility-title"
    use:focusTrap
  >
    <ManagePeopleVisibility
      bind:people
      totalPeopleCount={data.people.total}
      titleId="manage-visibility-title"
      onClose={() => (selectHidden = false)}
      {loadNextPage}
    />
  </div>
{/if}
