<script lang="ts">
  import { scrollMemory } from '#lib/actions/scroll-memory.svelte.ts';
  import UserPageLayout from '#lib/components/layouts/UserPageLayout.svelte';
  import { QueryParameter, SessionStorageKey } from '#lib/constants.ts';
  import SearchBar from '#lib/elements/SearchBar.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import PeopleFilterModal from '#lib/modals/PeopleFilterModal.svelte';
  import PersonMergeSuggestionModal from '#lib/modals/PersonMergeSuggestionModal.svelte';
  import { executeMutation, queryClient } from '#lib/queries/client.ts';
  import { getClusterGroupUsersQuery } from '#lib/queries/cluster-group.query.ts';
  import { getAllPeoplePagesQuery, updateCachedPerson, updatePersonMutation } from '#lib/queries/person.query.ts';
  import { searchPersonQuery } from '#lib/queries/search.query.ts';
  import { Route } from '#lib/route.ts';
  import { getPeopleUserActions } from '#lib/services/person-user.service.ts';
  import { locale } from '#lib/stores/preferences.store.ts';
  import { websocketEvents } from '#lib/stores/websocket.ts';
  import { Draft } from '#lib/utils/draft.svelte.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
  import { withUpdateStrategy } from '#lib/utils/person.ts';
  import { normalizeSearchString } from '#lib/utils/string-utils.ts';
  import { type PersonResponseDto } from '@immich/sdk';
  import { ActionButton, Button, Icon, IconButton, modalManager, shortcut } from '@immich/ui';
  import { mdiAccountOff, mdiEyeOutline, mdiTune } from '@mdi/js';
  import { createInfiniteQuery, createQuery, type MutationMeta } from '@tanstack/svelte-query';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import type { PageData } from './$types';
  import PeopleCard from './PeopleCard.svelte';
  import PeopleInfiniteScroll from './PeopleInfiniteScroll.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const query = createInfiniteQuery(
    () => getAllPeoplePagesQuery({ withHidden: true, ...data.filter }),
    () => queryClient,
  );
  const people = $derived(query.data?.pages.flatMap((page) => page.people) ?? []);
  const firstPage = $derived(query.data?.pages[0]);

  let searchName = $state('');
  let personMerge1 = $state<PersonResponseDto>();
  let personMerge2 = $state<PersonResponseDto>();
  let potentialMergePeople: PersonResponseDto[] = $state([]);
  let editingPerson: PersonResponseDto | null = $state(null);
  const newName = new Draft(() => people.find(({ id }) => id === editingPerson?.id)?.name ?? '');
  let innerHeight = $state(0);

  const clusterGroupUsersQuery = createQuery(
    () => getClusterGroupUsersQuery(authManager.user.clusterGroupId),
    () => queryClient,
  );
  const clusterGroupUsers = $derived(
    (clusterGroupUsersQuery.data ?? []).filter(({ id }) => id !== authManager.user.id),
  );

  onMount(() =>
    websocketEvents.on('on_person_thumbnail', (personId: string) =>
      updateCachedPerson(personId, (person) => ({ ...person, updatedAt: new Date().toISOString() })),
    ),
  );

  const loadInitialScroll = async () => {
    const savedPageCount = Number(sessionStorage.getItem(SessionStorageKey.INFINITE_SCROLL_PAGE));
    sessionStorage.removeItem(SessionStorageKey.INFINITE_SCROLL_PAGE);

    let { data, hasNextPage } = query;
    while (hasNextPage && (data?.pages.length ?? 0) < savedPageCount) {
      ({ data, hasNextPage } = await query.fetchNextPage());
    }
  };

  const handleSearchByName = async () => {
    const url = new URL(page.url.href);
    const getSearchedPeople = url.searchParams.get(QueryParameter.SEARCHED_PEOPLE);
    if (getSearchedPeople !== searchName) {
      if (searchName) {
        url.searchParams.set(QueryParameter.SEARCHED_PEOPLE, searchName);
      } else {
        url.searchParams.delete(QueryParameter.SEARCHED_PEOPLE);
      }
      await goto(url, { reset: false, replace: true, refreshAll: true });
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
      await updateName(personMerge1.id, newName.value);
      return;
    }

    const [, personToBeMergedInto] = response;
    if (personToBeMergedInto.name !== newName.value && editingPerson.id === personToBeMergedInto.id) {
      await updateName(personToBeMergedInto.id, newName.value, { success: { toast: 'change_name_successfully' } });
    }
  };

  const handleMergePeople = async (detail: PersonResponseDto) => {
    await goto(Route.viewPerson(detail, { previousRoute: Route.people(), action: 'merge' }));
  };

  const hasFilter = $derived(Object.values(data.filter).some((value) => value !== undefined));

  const handleFilter = async () => {
    const filter = await modalManager.show(PeopleFilterModal, { filter: data.filter });
    if (!filter) {
      return;
    }

    const url = new URL(page.url.href);
    for (const [key, value] of [
      [QueryParameter.SHARED_BY_ID, filter.sharedById],
      [QueryParameter.SHARED_WITH_ID, filter.sharedWithId],
      [QueryParameter.IS_FAVORITE, filter.isFavorite],
      [QueryParameter.IS_HIDDEN, filter.isHidden],
    ] as const) {
      if (value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    await goto(url, { reset: false });
  };

  const { ManageAccess } = $derived(
    getPeopleUserActions($t, clusterGroupUsers, query.hasNextPage ? undefined : people),
  );

  // hidden people are only shown when explicitly filtering for them
  let visiblePeople = $derived(data.filter.isHidden ? people : people.filter((people) => !people.isHidden));
  let countVisiblePeople = $derived((firstPage?.total ?? 0) - (data.filter.isHidden ? 0 : (firstPage?.hidden ?? 0)));

  const onNameChangeInputFocus = (person: PersonResponseDto) => {
    editingPerson = person;
    newName.reset();
  };

  const onNameChangeSubmit = async (name: string, targetPerson: PersonResponseDto) => {
    try {
      if (name === targetPerson.name) {
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
              normalizeSearchString(personMerge2?.name ?? '') === normalizeSearchString(person.name) &&
              person.id !== personMerge2?.id &&
              person.id !== personMerge1?.id &&
              !person.isHidden,
          )
          .slice(0, 3);
        await handleMerge();
        return;
      }
      await updateName(targetPerson.id, name);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  const onNameChangeInputUpdate = (event: Event) => {
    if (event.target) {
      newName.value = (event.target as HTMLInputElement).value;
    }
  };

  const updateName = async (id: string, name: string, meta?: MutationMeta) => {
    await executeMutation(() => updatePersonMutation(meta), [{ id, personUpdateDto: withUpdateStrategy({ name }) }], {
      onSuccess: () => newName.reset(),
    });
  };

  const findPeopleWithSimilarName = async (name: string, personId: string) => {
    const searchResult = await queryClient.query(searchPersonQuery({ name, withHidden: true }));
    const normalizedName = normalizeSearchString(name);
    return searchResult.find(
      (person) => normalizeSearchString(person.name) === normalizedName && person.id !== personId && person.name,
    );
  };
</script>

<svelte:window bind:innerHeight />

<UserPageLayout
  title={$t('people')}
  description={countVisiblePeople === 0 && !searchName ? undefined : `(${countVisiblePeople.toLocaleString($locale)})`}
  {@attach scrollMemory({
    routeStartsWith: Route.people(),
    beforeSave: () => {
      sessionStorage.setItem(SessionStorageKey.INFINITE_SCROLL_PAGE, String(query.data?.pages.length ?? 1));
    },
    beforeClear: () => {
      sessionStorage.removeItem(SessionStorageKey.INFINITE_SCROLL_PAGE);
    },
    beforeScroll: loadInitialScroll,
  })}
>
  {#snippet buttons()}
    <div class="flex items-center justify-center gap-2">
      <div class="hidden sm:block">
        <div class="h-10 w-40 lg:w-80">
          <SearchBar
            bind:name={searchName}
            placeholder={$t('search_people')}
            onSearch={() => handleSearchByName()}
            showLoadingSpinner={false}
            onReset={() => handleSearchByName()}
          />
        </div>
      </div>
      <Button
        leadingIcon={mdiEyeOutline}
        onclick={() => goto('/people/manage')}
        size="small"
        variant="ghost"
        color="secondary">{$t('show_and_hide_people')}</Button
      >
      <ActionButton action={ManageAccess} />
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        indicator={hasFilter ? 'primary' : undefined}
        icon={mdiTune}
        aria-label={$t('filters')}
        onclick={handleFilter}
      />
    </div>
  {/snippet}

  {#if countVisiblePeople > 0}
    <PeopleInfiniteScroll
      people={visiblePeople}
      hasNextPage={query.hasNextPage && !searchName}
      loadNextPage={() => query.fetchNextPage()}
    >
      {#snippet children({ person })}
        <div
          class="rounded-xl border-2 border-transparent p-2 transition-all hover:border-immich-primary/50 hover:bg-gray-200 hover:shadow-sm hover:dark:border-immich-dark-primary/25 dark:hover:bg-immich-dark-primary/20"
        >
          <PeopleCard {person} onMergePeople={() => handleMergePeople(person)} />

          <input
            type="text"
            class="mt-2 w-full rounded-2xl border-gray-100 bg-white py-2 text-center text-sm text-primary placeholder-gray-400 dark:border-gray-900 dark:bg-immich-dark-gray"
            value={person.id === editingPerson?.id ? newName.value : person.name}
            placeholder={$t('add_a_name')}
            {@attach shortcut({ shortcut: { key: 'Enter' }, onShortcut: (e) => e.currentTarget.blur() })}
            onfocusin={() => onNameChangeInputFocus(person)}
            onfocusout={() => onNameChangeSubmit(newName.value, person)}
            oninput={(event) => onNameChangeInputUpdate(event)}
          />
        </div>
      {/snippet}
    </PeopleInfiniteScroll>
  {:else}
    <div class="flex min-h-[calc(66vh-11rem)] w-full place-content-center items-center dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <Icon icon={mdiAccountOff} size="3.5em" />
        <p class="mt-5 line-clamp-2 max-w-lg overflow-hidden text-3xl font-medium">
          {$t(searchName ? 'search_no_people_named' : 'search_no_people', { values: { name: searchName } })}
        </p>
      </div>
    </div>
  {/if}
</UserPageLayout>
