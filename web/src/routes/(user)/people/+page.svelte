<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { focusTrap } from '$lib/actions/focus-trap';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import ManagePeopleVisibility from '$lib/components/faces-page/manage-people-visibility.svelte';
  import MergeSuggestionModal from '$lib/components/faces-page/merge-suggestion-modal.svelte';
  import PeopleCard from '$lib/components/faces-page/people-card.svelte';
  import PeopleInfiniteScroll from '$lib/components/faces-page/people-infinite-scroll.svelte';
  import SearchPeople from '$lib/components/faces-page/people-search.svelte';
  import SetBirthDateModal from '$lib/components/faces-page/set-birth-date-modal.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { ActionQueryParameterValue, AppRoute, QueryParameter } from '$lib/constants';
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
  import { mdiAccountOff, mdiEyeOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import type { PageData } from './$types';

  export let data: PageData;

  $: people = data.people.people;
  $: visiblePeople = people.filter((people) => !people.isHidden);
  $: countVisiblePeople = searchName ? searchedPeopleLocal.length : data.people.total - data.people.hidden;
  $: showPeople = searchName ? searchedPeopleLocal : visiblePeople;

  let selectHidden = false;
  let searchName = '';
  let showChangeNameModal = false;
  let showSetBirthDateModal = false;
  let showMergeModal = false;
  let personName = '';
  let nextPage = data.people.hasNextPage ? 2 : null;
  let personMerge1: PersonResponseDto;
  let personMerge2: PersonResponseDto;
  let potentialMergePeople: PersonResponseDto[] = [];
  let edittingPerson: PersonResponseDto | null = null;
  let searchedPeopleLocal: PersonResponseDto[] = [];
  let handleSearchPeople: (force?: boolean, name?: string) => Promise<void>;
  let changeNameInputEl: HTMLInputElement | null;
  let innerHeight: number;

  onMount(() => {
    const getSearchedPeople = $page.url.searchParams.get(QueryParameter.SEARCHED_PEOPLE);
    if (getSearchedPeople) {
      searchName = getSearchedPeople;
      handlePromiseError(handleSearchPeople(true, searchName));
    }
    return websocketEvents.on('on_person_thumbnail', (personId: string) => {
      for (const person of people) {
        if (person.id === personId) {
          person.updatedAt = new Date().toISOString();
        }
      }

      // trigger reactivity
      people = people;
    });
  });

  const loadNextPage = async () => {
    if (!nextPage) {
      return;
    }

    try {
      const { people: newPeople, hasNextPage } = await getAllPeople({ withHidden: true, page: nextPage });
      people = people.concat(newPeople);
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
    if (personToBeMergedIn.name !== personName && edittingPerson.id === personToBeMergedIn.id) {
      /*
       *
       * If the user merges one of the suggested people into the person he's editing it, it's merging the suggested person AND renames
       * the person he's editing
       *
       */
      try {
        await updatePerson({ id: personToBeMergedIn.id, personUpdateDto: { name: personName } });

        for (const person of people) {
          if (person.id === personToBeMergedIn.id) {
            person.name = personName;
            break;
          }
        }
        notificationController.show({
          message: $t('change_name_successfully'),
          type: NotificationType.Info,
        });

        // trigger reactivity
        people = people;
      } catch (error) {
        handleError(error, $t('errors.unable_to_save_name'));
      }
    }
  };

  const handleChangeName = (detail: PersonResponseDto) => {
    showChangeNameModal = true;
    personName = detail.name;
    personMerge1 = detail;
    edittingPerson = detail;

    setTimeout(() => changeNameInputEl?.focus(), 100);
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

      showChangeNameModal = false;
      notificationController.show({
        message: $t('changed_visibility_successfully'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_hide_person'));
    }
  };

  const handleMergePeople = async (detail: PersonResponseDto) => {
    await goto(
      `${AppRoute.PEOPLE}/${detail.id}?${QueryParameter.ACTION}=${ActionQueryParameterValue.MERGE}&${QueryParameter.PREVIOUS_ROUTE}=${AppRoute.PEOPLE}`,
    );
  };

  const submitNameChange = async () => {
    potentialMergePeople = [];
    showChangeNameModal = false;
    if (!edittingPerson || personName === edittingPerson.name) {
      return;
    }
    if (personName === '') {
      await changeName();
      return;
    }
    const data = await searchPerson({ name: personName, withHidden: true });

    // We check if another person has the same name as the name entered by the user

    const existingPerson = data.find(
      (person: PersonResponseDto) =>
        person.name.toLowerCase() === personName.toLowerCase() &&
        edittingPerson &&
        person.id !== edittingPerson.id &&
        person.name,
    );
    if (existingPerson) {
      personMerge2 = existingPerson;
      showMergeModal = true;
      potentialMergePeople = people
        .filter(
          (person: PersonResponseDto) =>
            personMerge2.name.toLowerCase() === person.name.toLowerCase() &&
            person.id !== personMerge2.id &&
            person.id !== personMerge1.id &&
            !person.isHidden,
        )
        .slice(0, 3);
      return;
    }
    await changeName();
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

  const changeName = async () => {
    showMergeModal = false;
    showChangeNameModal = false;

    if (!edittingPerson) {
      return;
    }
    try {
      const updatedPerson = await updatePerson({
        id: edittingPerson.id,
        personUpdateDto: { name: personName },
      });
      people = people.map((person: PersonResponseDto) => {
        if (person.id === updatedPerson.id) {
          return updatedPerson;
        }
        return person;
      });
      notificationController.show({
        message: $t('change_name_successfully'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  const onResetSearchBar = async () => {
    await clearQueryParam(QueryParameter.SEARCHED_PEOPLE, $page.url);
  };
</script>

<svelte:window bind:innerHeight />

{#if showMergeModal}
  <MergeSuggestionModal
    {personMerge1}
    {personMerge2}
    {potentialMergePeople}
    onClose={() => (showMergeModal = false)}
    onReject={changeName}
    onConfirm={handleMergeSamePerson}
  />
{/if}

<UserPageLayout
  title={$t('people')}
  description={countVisiblePeople === 0 && !searchName ? undefined : `(${countVisiblePeople.toLocaleString($locale)})`}
>
  <svelte:fragment slot="buttons">
    {#if people.length > 0}
      <div class="flex gap-2 items-center justify-center">
        <div class="hidden sm:block">
          <div class="w-40 lg:w-80 h-10">
            <SearchPeople
              type="searchBar"
              placeholder={$t('search_people')}
              onReset={onResetSearchBar}
              onSearch={handleSearch}
              bind:searchName
              bind:searchedPeopleLocal
              bind:handleSearch={handleSearchPeople}
            />
          </div>
        </div>
        <LinkButton on:click={() => (selectHidden = !selectHidden)}>
          <div class="flex flex-wrap place-items-center justify-center gap-x-1 text-sm">
            <Icon path={mdiEyeOutline} size="18" />
            <p class="ml-2">{$t('show_and_hide_people')}</p>
          </div>
        </LinkButton>
      </div>
    {/if}
  </svelte:fragment>

  {#if countVisiblePeople > 0 && (!searchName || searchedPeopleLocal.length > 0)}
    <PeopleInfiniteScroll
      people={showPeople}
      hasNextPage={!!nextPage && !searchName}
      {loadNextPage}
      let:person
      let:index
    >
      <PeopleCard
        {person}
        preload={index < 20}
        onChangeName={() => handleChangeName(person)}
        onSetBirthDate={() => handleSetBirthDate(person)}
        onMergePeople={() => handleMergePeople(person)}
        onHidePerson={() => handleHidePerson(person)}
      />
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

  {#if showChangeNameModal}
    <FullScreenModal title={$t('change_name')} onClose={() => (showChangeNameModal = false)}>
      <form on:submit|preventDefault={submitNameChange} autocomplete="off" id="change-name-form">
        <div class="flex flex-col gap-2">
          <label class="immich-form-label" for="name">{$t('name')}</label>
          <input
            class="immich-form-input"
            id="name"
            name="name"
            type="text"
            bind:value={personName}
            bind:this={changeNameInputEl}
          />
        </div>
      </form>
      <svelte:fragment slot="sticky-bottom">
        <Button
          color="gray"
          fullwidth
          on:click={() => {
            showChangeNameModal = false;
          }}>{$t('cancel')}</Button
        >
        <Button type="submit" fullwidth form="change-name-form">{$t('ok')}</Button>
      </svelte:fragment>
    </FullScreenModal>
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
  <section
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
  </section>
{/if}
