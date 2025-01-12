<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { scrollMemory } from '$lib/actions/scroll-memory';
  import Icon from '$lib/components/elements/icon.svelte';
  import PeopleInfiniteScroll from '$lib/components/faces-page/people-infinite-scroll.svelte';
  import SearchPeople from '$lib/components/faces-page/people-search.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handlePromiseError } from '$lib/utils';
  import { AppRoute, QueryParameter, SessionStorageKey } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import { handleError } from '$lib/utils/handle-error';
  import { clearQueryParam } from '$lib/utils/navigation';
  import { getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { mdiAccountOff } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let searchName = $state('');
  let currentPage = $state(1);
  let nextPage = $state(data.people.hasNextPage ? 2 : null);
  let searchedPeopleLocal: PersonResponseDto[] = $state([]);
  let innerHeight = $state(0);
  let searchPeopleElement = $state<ReturnType<typeof SearchPeople>>();

  const loadInitialScroll = () =>
    new Promise<void>((resolve) => {
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
      } else {
        resolve();
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
</script>

<svelte:window bind:innerHeight />

<UserPageLayout
  title={$t('choose_person_see_similar')}
  description={countVisiblePeople === 0 && !searchName ? undefined : `(${countVisiblePeople.toLocaleString($locale)})`}
  use={[
    [
      scrollMemory,
      {
        routeStartsWith: AppRoute.MERGE_FACES,
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
      </div>
    {/if}
  {/snippet}

  {#if countVisiblePeople > 0 && (!searchName || searchedPeopleLocal.length > 0)}
    <PeopleInfiniteScroll people={showPeople} hasNextPage={!!nextPage && !searchName} {loadNextPage}>
      {#snippet children({ person, index })}
        <a href="{AppRoute.MERGE_FACES}/{person.id}" class="group relative w-full h-full block">
          <ImageThumbnail
            preload={index < 20}
            shadow
            url={getPeopleThumbnailUrl(person)}
            altText={person.name}
            widthStyle="100%"
            hiddenIconClass="text-white group-hover:text-black transition-colors"
          />
          {#if person.name}
            <span class="absolute bottom-2 left-0 w-full select-text px-1 text-center font-medium text-white">
              {person.name}
            </span>
          {/if}
        </a>
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
</UserPageLayout>
