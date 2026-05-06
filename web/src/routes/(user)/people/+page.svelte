<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { scrollMemory } from '$lib/actions/scroll-memory';
  import ActionMenuItem from '$lib/components/ActionMenuItem.svelte';
  import PeopleManagementGrid from '$lib/components/people/people-management-grid.svelte';
  import type { ManagedPerson } from '$lib/components/people/people-types';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ManagePeopleVisibility from './manage-people-visibility.svelte';
  import SearchPeople from '$lib/components/faces-page/people-search.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { QueryParameter, SessionStorageKey } from '$lib/constants';
  import PersonMergeSuggestionModal from '$lib/modals/PersonMergeSuggestionModal.svelte';
  import { Route } from '$lib/route';
  import { getPersonActions } from '$lib/services/person.service';
  import { locale } from '$lib/stores/preferences.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { handlePromiseError } from '$lib/utils';
  import { getGlobalPersonHref, getGlobalPersonThumbnailUrl } from '$lib/utils/global-person-route';
  import { handleError } from '$lib/utils/handle-error';
  import { clearQueryParam } from '$lib/utils/navigation';
  import {
    getAllPeople,
    getPerson,
    searchPerson,
    updatePerson,
    updateSpacePerson,
    type PersonResponseDto,
  } from '@immich/sdk';
  import { Button, Icon, modalManager, toastManager } from '@immich/ui';
  import {
    mdiAccountMultipleCheckOutline,
    mdiAccountOff,
    mdiDotsVertical,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiHeartMinusOutline,
    mdiHeartOutline,
  } from '@mdi/js';
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
  let newName = $state('');
  let currentPage = $state(1);
  let nextPage = $state(data.people.hasNextPage ? 2 : null);
  let personMerge1 = $state<PersonResponseDto>();
  let personMerge2 = $state<PersonResponseDto>();
  let potentialMergePeople: PersonResponseDto[] = $state([]);
  let editingPerson: PersonResponseDto | null = $state(null);
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
                return getAllPeople({ withHidden: true, withSharedSpaces: true, page: startingPage + i });
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
      const { people: newPeople, hasNextPage } = await getAllPeople({
        withHidden: true,
        withSharedSpaces: true,
        page: nextPage,
      });
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

  const handleMerge = async () => {
    if (!editingPerson || !personMerge1 || !personMerge2) {
      return;
    }

    const response = await modalManager.show(PersonMergeSuggestionModal, {
      personToMerge: personMerge1,
      personToBeMergedInto: personMerge2,
      potentialMergePeople,
    });

    if (!response) {
      await updateName(personMerge1, newName);
      return;
    }

    const [personToMerge, personToBeMergedInto] = response;

    const mergedPerson = await getPerson({ id: personToBeMergedInto.id });

    people = people.filter((person: PersonResponseDto) => person.id !== personToMerge.id);
    people = people.map((person: PersonResponseDto) => (person.id === personToBeMergedInto.id ? mergedPerson : person));

    if (personToBeMergedInto.name !== newName && editingPerson.id === personToBeMergedInto.id) {
      /*
       *
       * If the user merges one of the suggested people into the person he's editing, it's merging the suggested person AND renames
       * the person he's editing
       *
       */
      try {
        await updatePerson({ id: personToBeMergedInto.id, personUpdateDto: { name: newName } });

        for (const person of people) {
          if (person.id === personToBeMergedInto.id) {
            person.name = newName;
            break;
          }
        }
        toastManager.primary($t('change_name_successfully'));
      } catch (error) {
        handleError(error, $t('errors.unable_to_save_name'));
      }
    }
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

      toastManager.primary($t('changed_visibility_successfully'));
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

      people = people.map((person: PersonResponseDto) => {
        if (person.id === updatedPerson.id) {
          return updatedPerson;
        }
        return person;
      });

      toastManager.primary(updatedPerson.isFavorite ? $t('added_to_favorites') : $t('removed_from_favorites'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: detail.isFavorite } }));
    }
  };

  const handleMergePeople = async (detail: PersonResponseDto) => {
    await goto(Route.viewPerson(detail, { previousRoute: Route.people(), action: 'merge' }));
  };

  const onResetSearchBar = async () => {
    await clearQueryParam(QueryParameter.SEARCHED_PEOPLE, $page.url);
  };

  let people = $derived(data.people.people);

  let visiblePeople = $derived(people.filter((people) => !people.isHidden));
  let countVisiblePeople = $derived(searchName ? searchedPeopleLocal.length : data.people.total - data.people.hidden);
  let showPeople = $derived(searchName ? searchedPeopleLocal : visiblePeople);

  const getPersonHref = (person: PersonResponseDto) => getGlobalPersonHref(person, Route.people());

  const getPersonThumbnail = (person: PersonResponseDto) => getGlobalPersonThumbnailUrl(person);

  const isPersonalPrimary = (person: PersonResponseDto) =>
    !person.primaryProfile || person.primaryProfile.type === 'user-person';
  const isSpacePrimary = (person: PersonResponseDto) =>
    person.primaryProfile?.type === 'space-person' && !!person.primaryProfile.spaceId;
  const canEditName = (person: PersonResponseDto) => isPersonalPrimary(person) || isSpacePrimary(person);

  const toManagedPerson = (person: PersonResponseDto): ManagedPerson => ({
    id: person.id,
    displayName: person.name,
    canonicalName: person.name,
    thumbnailUrl: getPersonThumbnail(person),
    href: getPersonHref(person),
    isHidden: person.isHidden,
    isFavorite: person.isFavorite,
    type: person.type,
    species: person.species,
    assetCount: person.numberOfAssets,
    canEditPersonalProfile: isPersonalPrimary(person),
  });

  const onNameChangeSubmit = async (name: string, targetPerson: PersonResponseDto) => {
    editingPerson = targetPerson;
    newName = name;
    try {
      if (name == targetPerson.name) {
        return;
      }

      if (!isPersonalPrimary(targetPerson)) {
        await updateName(targetPerson, name);
        return;
      }

      if (name === '') {
        await updateName(targetPerson, '');
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
        await handleMerge();
        return;
      }
      await updateName(targetPerson, name);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  const updateName = async (targetPerson: PersonResponseDto, name: string) => {
    const spaceId =
      targetPerson.primaryProfile?.type === 'space-person' ? targetPerson.primaryProfile.spaceId : undefined;

    if (spaceId) {
      const updatedPerson = await updateSpacePerson({
        id: spaceId,
        personId: targetPerson.primaryProfile?.id ?? targetPerson.id,
        sharedSpacePersonUpdateDto: { name },
      });

      people = people.map((person: PersonResponseDto) =>
        person.id === targetPerson.id
          ? {
              ...person,
              name: updatedPerson.name,
              birthDate: updatedPerson.birthDate ?? person.birthDate,
              isHidden: updatedPerson.isHidden,
              updatedAt: updatedPerson.updatedAt,
              type: updatedPerson.type ?? person.type,
              numberOfAssets: updatedPerson.assetCount,
            }
          : person,
      );
      newName = '';
      return;
    }

    const id = targetPerson.primaryProfile?.id ?? targetPerson.id;
    const updatedPerson = await updatePerson({
      id,
      personUpdateDto: { name },
    });

    people = people.map((person: PersonResponseDto) => (person.id === id ? updatedPerson : person));
    newName = '';
  };

  const findPeopleWithSimilarName = async (name: string, personId: string) => {
    const searchResult = await searchPerson({ name, withHidden: true });
    return searchResult.find(
      (person) => person.name.toLowerCase() === name.toLowerCase() && person.id !== personId && person.name,
    );
  };

  const onPersonUpdate = (response: PersonResponseDto) => {
    people = people.map((person: PersonResponseDto) => {
      if (person.id === response.id) {
        return response;
      }
      return person;
    });
  };
</script>

<svelte:window bind:innerHeight />

<OnEvents {onPersonUpdate} />

<UserPageLayout
  title={$t('people')}
  description={countVisiblePeople === 0 && !searchName ? undefined : `(${countVisiblePeople.toLocaleString($locale)})`}
  use={[
    [
      scrollMemory,
      {
        routeStartsWith: Route.people(),
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
              withSharedSpaces={true}
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
    <PeopleManagementGrid
      people={showPeople}
      {toManagedPerson}
      hasNextPage={!!nextPage && !searchName}
      {loadNextPage}
      canEditNames={canEditName}
      canShowActions={isPersonalPrimary}
      onNameSubmit={onNameChangeSubmit}
    >
      {#snippet actions(person)}
        {@const Actions = getPersonActions($t, person)}
        <ButtonContextMenu
          buttonClass="icon-white-drop-shadow"
          color="secondary"
          size="medium"
          variant="filled"
          icon={mdiDotsVertical}
          title={$t('show_person_options')}
        >
          <MenuOption onClick={() => handleHidePerson(person)} icon={mdiEyeOffOutline} text={$t('hide_person')} />
          <ActionMenuItem action={Actions.SetDateOfBirth} />
          <MenuOption
            onClick={() => handleMergePeople(person)}
            icon={mdiAccountMultipleCheckOutline}
            text={$t('merge_people')}
          />
          <MenuOption
            onClick={() => handleToggleFavorite(person)}
            icon={person.isFavorite ? mdiHeartMinusOutline : mdiHeartOutline}
            text={person.isFavorite ? $t('unfavorite') : $t('to_favorite')}
          />
        </ButtonContextMenu>
      {/snippet}
    </PeopleManagementGrid>
  {:else}
    <div class="flex min-h-[calc(66vh-11rem)] w-full place-content-center items-center dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <Icon icon={mdiAccountOff} size="3.5em" />
        <p class="mt-5 text-3xl font-medium max-w-lg line-clamp-2 overflow-hidden">
          {$t(searchName ? 'search_no_people_named' : 'search_no_people', { values: { name: searchName } })}
        </p>
      </div>
    </div>
  {/if}
</UserPageLayout>

{#if selectHidden}
  <dialog
    transition:fly={{ y: innerHeight, duration: 150, easing: quintOut, opacity: 0 }}
    class="fixed inset-0 h-full w-full max-w-none max-h-none bg-light"
    aria-labelledby="manage-visibility-title"
    {@attach (dialog) => dialog.showModal()}
  >
    <ManagePeopleVisibility
      {people}
      totalPeopleCount={data.people.total}
      titleId="manage-visibility-title"
      onClose={() => (selectHidden = false)}
      onUpdate={(updatedPeople) => (people = updatedPeople.slice())}
      {loadNextPage}
    />
  </dialog>
{/if}
