<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';
  import PeopleCard from '$lib/components/faces-page/people-card.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { api, type PeopleUpdateItem, type PersonResponseDto } from '@api';
  import { goto } from '$app/navigation';
  import {
    ActionQueryParameterValue,
    AppRoute,
    QueryParameter,
    maximumLengthSearchPeople,
    timeBeforeShowLoadingSpinner,
  } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import ShowHide from '$lib/components/faces-page/show-hide.svelte';
  import IconButton from '$lib/components/elements/buttons/icon-button.svelte';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import MergeSuggestionModal from '$lib/components/faces-page/merge-suggestion-modal.svelte';
  import SetBirthDateModal from '$lib/components/faces-page/set-birth-date-modal.svelte';
  import { shouldIgnoreShortcut } from '$lib/utils/shortcut';
  import { mdiAccountOff, mdiEyeOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { searchNameLocal } from '$lib/utils/person';
  import SearchBar from '$lib/components/faces-page/search-bar.svelte';
  import { page } from '$app/stores';

  export let data: PageData;

  let people = data.people.people;
  let countTotalPeople = data.people.total;

  let selectHidden = false;
  let initialHiddenValues: Record<string, boolean> = {};
  let eyeColorMap: Record<string, 'black' | 'white'> = {};

  let searchedPeople: PersonResponseDto[] = [];
  let searchName = '';
  let searchWord: string;
  let isSearchingPeople = false;

  let showLoadingSpinner = false;
  let toggleVisibility = false;

  let showChangeNameModal = false;
  let showSetBirthDateModal = false;
  let showMergeModal = false;
  let personName = '';
  let personMerge1: PersonResponseDto;
  let personMerge2: PersonResponseDto;
  let potentialMergePeople: PersonResponseDto[] = [];
  let edittingPerson: PersonResponseDto | null = null;

  let innerHeight: number;

  for (const person of people) {
    initialHiddenValues[person.id] = person.isHidden;
  }

  $: searchedPeopleLocal = searchName ? searchNameLocal(searchName, searchedPeople, maximumLengthSearchPeople) : [];

  $: countVisiblePeople = people.filter((person) => !person.isHidden).length;

  const onKeyboardPress = (event: KeyboardEvent) => handleKeyboardPress(event);

  onMount(() => {
    document.addEventListener('keydown', onKeyboardPress);
    const getSearchedPeople = $page.url.searchParams.get(QueryParameter.SEARCHED_PEOPLE);
    if (getSearchedPeople) {
      searchName = getSearchedPeople;
      searchPeople(true);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('keydown', onKeyboardPress);
    }
  });

  const handleKeyboardPress = (event: KeyboardEvent) => {
    if (shouldIgnoreShortcut(event)) {
      return;
    }
    switch (event.key) {
      case 'Escape': {
        handleCloseClick();
        return;
      }
    }
  };

  const handleSearch = (force: boolean) => {
    $page.url.searchParams.set(QueryParameter.SEARCHED_PEOPLE, searchName);
    goto($page.url);
    searchPeople(force);
  };

  const handleCloseClick = () => {
    for (const person of people) {
      person.isHidden = initialHiddenValues[person.id];
    }
    // trigger reactivity
    people = people;

    // Reset variables used on the "Show & hide people"   modal
    showLoadingSpinner = false;
    selectHidden = false;
    toggleVisibility = false;
  };

  const handleResetVisibility = () => {
    for (const person of people) {
      person.isHidden = initialHiddenValues[person.id];
    }

    // trigger reactivity
    people = people;
  };

  const handleToggleVisibility = () => {
    toggleVisibility = !toggleVisibility;
    for (const person of people) {
      person.isHidden = toggleVisibility;
    }

    // trigger reactivity
    people = people;
  };

  const handleDoneClick = async () => {
    showLoadingSpinner = true;
    let changed: PeopleUpdateItem[] = [];
    try {
      // Check if the visibility for each person has been changed
      for (const person of people) {
        if (person.isHidden !== initialHiddenValues[person.id]) {
          changed.push({ id: person.id, isHidden: person.isHidden });

          // Update the initial hidden values
          initialHiddenValues[person.id] = person.isHidden;
        }
      }

      if (changed.length > 0) {
        const { data: results } = await api.personApi.updatePeople({
          peopleUpdateDto: { people: changed },
        });
        const count = results.filter(({ success }) => success).length;
        if (results.length - count > 0) {
          notificationController.show({
            type: NotificationType.Error,
            message: `Unable to change the visibility for ${results.length - count} ${
              results.length - count <= 1 ? 'person' : 'people'
            }`,
          });
        }
        notificationController.show({
          type: NotificationType.Info,
          message: `Visibility changed for ${count} ${count <= 1 ? 'person' : 'people'}`,
        });
      }
    } catch (error) {
      handleError(
        error,
        `Unable to change the visibility for ${changed.length} ${changed.length <= 1 ? 'person' : 'people'}`,
      );
    }
    // Reset variables used on the "Show & hide people" modal
    showLoadingSpinner = false;
    selectHidden = false;
    toggleVisibility = false;
  };

  const handleMergeSamePerson = async (response: [PersonResponseDto, PersonResponseDto]) => {
    const [personToMerge, personToBeMergedIn] = response;
    showMergeModal = false;

    if (!edittingPerson) {
      return;
    }
    try {
      await api.personApi.mergePerson({
        id: personToBeMergedIn.id,
        mergePersonDto: { ids: [personToMerge.id] },
      });

      const { data: mergedPerson } = await api.personApi.getPerson({ id: personToBeMergedIn.id });

      countVisiblePeople--;
      people = people.filter((person: PersonResponseDto) => person.id !== personToMerge.id);
      people = people.map((person: PersonResponseDto) => (person.id === personToBeMergedIn.id ? mergedPerson : person));

      notificationController.show({
        message: 'Merge people succesfully',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to save name');
    }
    if (personToBeMergedIn.name !== personName && edittingPerson.id === personToBeMergedIn.id) {
      /*
       *
       * If the user merges one of the suggested people into the person he's editing it, it's merging the suggested person AND renames
       * the person he's editing
       *
       */
      try {
        await api.personApi.updatePerson({ id: personToBeMergedIn.id, personUpdateDto: { name: personName } });

        for (const person of people) {
          if (person.id === personToBeMergedIn.id) {
            person.name = personName;
            break;
          }
        }
        notificationController.show({
          message: 'Change name succesfully',
          type: NotificationType.Info,
        });

        // trigger reactivity
        people = people;
      } catch (error) {
        handleError(error, 'Unable to save name');
      }
    }
  };

  const handleChangeName = (detail: PersonResponseDto) => {
    showChangeNameModal = true;
    personName = detail.name;
    personMerge1 = detail;
    edittingPerson = detail;
  };

  const handleSetBirthDate = (detail: PersonResponseDto) => {
    showSetBirthDateModal = true;
    edittingPerson = detail;
  };

  const handleHidePerson = async (detail: PersonResponseDto) => {
    try {
      const { data: updatedPerson } = await api.personApi.updatePerson({
        id: detail.id,
        personUpdateDto: { isHidden: true },
      });

      people = people.map((person: PersonResponseDto) => {
        if (person.id === updatedPerson.id) {
          return updatedPerson;
        }
        return person;
      });

      for (const person of people) {
        initialHiddenValues[person.id] = person.isHidden;
      }

      showChangeNameModal = false;

      notificationController.show({
        message: 'Changed visibility succesfully',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to hide person');
    }
  };

  const handleMergePeople = (detail: PersonResponseDto) => {
    goto(
      `${AppRoute.PEOPLE}/${detail.id}?${QueryParameter.ACTION}=${ActionQueryParameterValue.MERGE}&${QueryParameter.PREVIOUS_ROUTE}=${AppRoute.PEOPLE}`,
    );
  };

  const searchPeople = async (force: boolean) => {
    if (searchName === '') {
      if ($page.url.searchParams.has(QueryParameter.SEARCHED_PEOPLE)) {
        $page.url.searchParams.delete(QueryParameter.SEARCHED_PEOPLE);
        goto($page.url);
      }
      return;
    }
    if (!force && people.length < maximumLengthSearchPeople && searchName.startsWith(searchWord)) {
      return;
    }

    const timeout = setTimeout(() => (isSearchingPeople = true), timeBeforeShowLoadingSpinner);
    try {
      const { data } = await api.searchApi.searchPerson({ name: searchName, withHidden: false });

      searchedPeople = data;
      searchWord = searchName;
    } catch (error) {
      handleError(error, "Can't search people");
    } finally {
      clearTimeout(timeout);
    }

    isSearchingPeople = false;
  };

  const submitNameChange = async () => {
    potentialMergePeople = [];
    showChangeNameModal = false;
    if (!edittingPerson || personName === edittingPerson.name) {
      return;
    }
    if (personName === '') {
      changeName();
      return;
    }
    const { data } = await api.searchApi.searchPerson({ name: personName, withHidden: true });

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
    changeName();
  };

  const submitBirthDateChange = async (value: string) => {
    showSetBirthDateModal = false;
    if (!edittingPerson || value === edittingPerson.birthDate) {
      return;
    }

    try {
      const { data: updatedPerson } = await api.personApi.updatePerson({
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
        message: 'Date of birth saved succesfully',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to save name');
    }
  };

  const changeName = async () => {
    showMergeModal = false;
    showChangeNameModal = false;

    if (!edittingPerson) {
      return;
    }
    try {
      const { data: updatedPerson } = await api.personApi.updatePerson({
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
        message: 'Change name succesfully',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to save name');
    }
  };
</script>

<svelte:window bind:innerHeight />

{#if showMergeModal}
  <FullScreenModal on:clickOutside={() => (showMergeModal = false)}>
    <MergeSuggestionModal
      {personMerge1}
      {personMerge2}
      {potentialMergePeople}
      on:close={() => (showMergeModal = false)}
      on:reject={() => changeName()}
      on:confirm={(event) => handleMergeSamePerson(event.detail)}
    />
  </FullScreenModal>
{/if}

<UserPageLayout title="People" description={countTotalPeople === 0 ? undefined : `(${countTotalPeople.toString()})`}>
  <svelte:fragment slot="buttons">
    {#if countTotalPeople > 0}
      <div class="flex gap-2 items-center justify-center">
        <div class="hidden sm:block">
          <div class="w-40 lg:w-80 h-10">
            <SearchBar
              bind:name={searchName}
              {isSearchingPeople}
              on:reset={() => {
                searchedPeople = [];
              }}
              on:search={({ detail }) => handleSearch(detail.force ?? false)}
            />
          </div>
        </div>
        <IconButton on:click={() => (selectHidden = !selectHidden)}>
          <div class="flex flex-wrap place-items-center justify-center gap-x-1 text-sm">
            <Icon path={mdiEyeOutline} size="18" />
            <p class="ml-2">Show & hide people</p>
          </div>
        </IconButton>
      </div>
    {/if}
  </svelte:fragment>

  {#if countVisiblePeople > 0}
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9 gap-1">
      {#each people as person, index (person.id)}
        {#if !person.isHidden && (searchName ? searchedPeopleLocal.some((searchedPerson) => searchedPerson.id === person.id) : true)}
          <PeopleCard
            {person}
            preload={index < 20}
            on:change-name={() => handleChangeName(person)}
            on:set-birth-date={() => handleSetBirthDate(person)}
            on:merge-people={() => handleMergePeople(person)}
            on:hide-person={() => handleHidePerson(person)}
          />
        {/if}
      {/each}
    </div>
  {:else}
    <div class="flex min-h-[calc(66vh_-_11rem)] w-full place-content-center items-center dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <Icon path={mdiAccountOff} size="3.5em" />
        <p class="mt-5 text-3xl font-medium">No people</p>
      </div>
    </div>
  {/if}

  {#if showChangeNameModal}
    <FullScreenModal on:clickOutside={() => (showChangeNameModal = false)}>
      <div
        class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
      >
        <div
          class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
        >
          <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Change name</h1>
        </div>

        <form on:submit|preventDefault={submitNameChange} autocomplete="off">
          <div class="m-4 flex flex-col gap-2">
            <label class="immich-form-label" for="name">Name</label>
            <!-- svelte-ignore a11y-autofocus -->
            <input class="immich-form-input" id="name" name="name" type="text" bind:value={personName} autofocus />
          </div>

          <div class="mt-8 flex w-full gap-4 px-4">
            <Button
              color="gray"
              fullwidth
              on:click={() => {
                showChangeNameModal = false;
              }}>Cancel</Button
            >
            <Button type="submit" fullwidth>Ok</Button>
          </div>
        </form>
      </div>
    </FullScreenModal>
  {/if}

  {#if showSetBirthDateModal}
    <SetBirthDateModal
      birthDate={edittingPerson?.birthDate ?? ''}
      on:close={() => (showSetBirthDateModal = false)}
      on:updated={(event) => submitBirthDateChange(event.detail)}
    />
  {/if}
</UserPageLayout>
{#if selectHidden}
  <ShowHide
    on:done={handleDoneClick}
    on:close={handleCloseClick}
    on:reset={handleResetVisibility}
    on:change={handleToggleVisibility}
    bind:showLoadingSpinner
    bind:toggleVisibility
    screenHeight={innerHeight}
  >
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9 gap-1">
      {#each people as person, index (person.id)}
        <button
          class="relative"
          on:click={() => (person.isHidden = !person.isHidden)}
          on:mouseenter={() => (eyeColorMap[person.id] = 'black')}
          on:mouseleave={() => (eyeColorMap[person.id] = 'white')}
        >
          <ImageThumbnail
            preload={searchName !== '' || index < 20}
            bind:hidden={person.isHidden}
            shadow
            url={api.getPeopleThumbnailUrl(person.id)}
            altText={person.name}
            widthStyle="100%"
            bind:eyeColor={eyeColorMap[person.id]}
          />
          {#if person.name}
            <span class="absolute bottom-2 left-0 w-full select-text px-1 text-center font-medium text-white">
              {person.name}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </ShowHide>
{/if}
