<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    AssetTypeEnum,
    SearchSuggestionType,
    type PersonResponseDto,
    type SmartSearchDto,
    type MetadataSearchDto,
  } from '@immich/sdk';
  import { getAllPeople, getSearchSuggestions } from '@immich/sdk';
  import { mdiArrowRight, mdiClose } from '@mdi/js';
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Combobox, { type ComboBoxOption } from '../combobox.svelte';
  import { DateTime } from 'luxon';

  enum MediaType {
    All = 'all',
    Image = 'image',
    Video = 'video',
  }

  type SearchSuggestion = {
    people: PersonResponseDto[];
    country: ComboBoxOption[];
    state: ComboBoxOption[];
    city: ComboBoxOption[];
    make: ComboBoxOption[];
    model: ComboBoxOption[];
  };

  type SearchParams = {
    state?: string;
    country?: string;
    city?: string;
    cameraMake?: string;
    cameraModel?: string;
  };

  type SearchFilter = {
    context?: string;
    people: (PersonResponseDto | Pick<PersonResponseDto, 'id'>)[];

    location: {
      country?: ComboBoxOption;
      state?: ComboBoxOption;
      city?: ComboBoxOption;
    };

    camera: {
      make?: ComboBoxOption;
      model?: ComboBoxOption;
    };

    date: {
      takenAfter?: string;
      takenBefore?: string;
    };

    isArchive?: boolean;
    isFavorite?: boolean;
    isNotInAlbum?: boolean;

    mediaType: MediaType;
  };

  export let searchQuery: MetadataSearchDto | SmartSearchDto;

  let suggestions: SearchSuggestion = {
    people: [],
    country: [],
    state: [],
    city: [],
    make: [],
    model: [],
  };

  let filter: SearchFilter = {
    context: undefined,
    people: [],
    location: {
      country: undefined,
      state: undefined,
      city: undefined,
    },
    camera: {
      make: undefined,
      model: undefined,
    },
    date: {
      takenAfter: undefined,
      takenBefore: undefined,
    },
    isArchive: undefined,
    isFavorite: undefined,
    isNotInAlbum: undefined,
    mediaType: MediaType.All,
  };

  const dispatch = createEventDispatcher<{ search: SmartSearchDto | MetadataSearchDto }>();
  let showAllPeople = false;

  let filterBoxWidth = 0;
  $: numberOfPeople = (filterBoxWidth - 80) / 85;
  $: peopleList = showAllPeople ? suggestions.people : suggestions.people.slice(0, numberOfPeople);

  onMount(() => {
    getPeople();
    populateExistingFilters();
  });

  function orderBySelectedPeopleFirst<T extends Pick<PersonResponseDto, 'id'>>(people: T[]) {
    return people.sort((a, _) => {
      if (filter.people.some((p) => p.id === a.id)) {
        return -1;
      }
      return 1;
    });
  }

  const getPeople = async () => {
    try {
      const { people } = await getAllPeople({ withHidden: false });
      suggestions.people = orderBySelectedPeopleFirst(people);
    } catch (error) {
      handleError(error, 'Failed to get people');
    }
  };

  const handlePeopleSelection = (id: string) => {
    if (filter.people.some((p) => p.id === id)) {
      filter.people = filter.people.filter((p) => p.id !== id);
      return;
    }

    const person = suggestions.people.find((p) => p.id === id);
    if (person) {
      filter.people = [...filter.people, person];
    }
  };

  const updateSuggestion = async (type: SearchSuggestionType, params: SearchParams) => {
    if (
      type === SearchSuggestionType.City ||
      type === SearchSuggestionType.State ||
      type === SearchSuggestionType.Country
    ) {
      suggestions = { ...suggestions, city: [], state: [], country: [] };
    }

    if (type === SearchSuggestionType.CameraMake || type === SearchSuggestionType.CameraModel) {
      suggestions = { ...suggestions, make: [], model: [] };
    }

    try {
      const data = await getSearchSuggestions({
        $type: type,
        country: params.country,
        state: params.state,
        make: params.cameraMake,
        model: params.cameraModel,
      });

      switch (type) {
        case SearchSuggestionType.Country: {
          for (const country of data) {
            suggestions.country = [...suggestions.country, { label: country, value: country }];
          }
          break;
        }

        case SearchSuggestionType.State: {
          for (const state of data) {
            suggestions.state = [...suggestions.state, { label: state, value: state }];
          }

          break;
        }

        case SearchSuggestionType.City: {
          for (const city of data) {
            suggestions.city = [...suggestions.city, { label: city, value: city }];
          }
          break;
        }

        case SearchSuggestionType.CameraMake: {
          for (const make of data) {
            suggestions.make = [...suggestions.make, { label: make, value: make }];
          }
          break;
        }

        case SearchSuggestionType.CameraModel: {
          for (const model of data) {
            suggestions.model = [...suggestions.model, { label: model, value: model }];
          }
          break;
        }
      }
    } catch (error) {
      handleError(error, 'Failed to get search suggestions');
    }
  };

  const resetForm = () => {
    filter = {
      context: undefined,
      people: [],
      location: {
        country: undefined,
        state: undefined,
        city: undefined,
      },
      camera: {
        make: undefined,
        model: undefined,
      },
      date: {
        takenAfter: undefined,
        takenBefore: undefined,
      },
      isArchive: undefined,
      isFavorite: undefined,
      isNotInAlbum: undefined,
      mediaType: MediaType.All,
    };
  };

  const search = async () => {
    let type: AssetTypeEnum | undefined = undefined;

    if (filter.mediaType === MediaType.Image) {
      type = AssetTypeEnum.Image;
    } else if (filter.mediaType === MediaType.Video) {
      type = AssetTypeEnum.Video;
    }

    let payload: SmartSearchDto | MetadataSearchDto = {
      country: filter.location.country?.value,
      state: filter.location.state?.value,
      city: filter.location.city?.value,
      make: filter.camera.make?.value,
      model: filter.camera.model?.value,
      takenAfter: filter.date.takenAfter
        ? DateTime.fromFormat(filter.date.takenAfter, 'yyyy-MM-dd').toUTC().startOf('day').toString()
        : undefined,
      takenBefore: filter.date.takenBefore
        ? DateTime.fromFormat(filter.date.takenBefore, 'yyyy-MM-dd').toUTC().endOf('day').toString()
        : undefined,
      /* eslint-disable unicorn/prefer-logical-operator-over-ternary */
      isArchived: filter.isArchive ? filter.isArchive : undefined,
      isFavorite: filter.isFavorite ? filter.isFavorite : undefined,
      isNotInAlbum: filter.isNotInAlbum ? filter.isNotInAlbum : undefined,
      personIds: filter.people && filter.people.length > 0 ? filter.people.map((p) => p.id) : undefined,
      type,
    };

    if (filter.context) {
      if (payload.personIds && payload.personIds.length > 0) {
        handleError(
          new Error('Context search does not support people filter'),
          'Context search does not support people filter',
        );
        return;
      }

      payload = {
        ...payload,
        query: filter.context,
      };
    }

    dispatch('search', payload);
  };

  function populateExistingFilters() {
    if (searchQuery) {
      const personIds = 'personIds' in searchQuery && searchQuery.personIds ? searchQuery.personIds : [];

      filter = {
        context: 'query' in searchQuery ? searchQuery.query : '',
        people: orderBySelectedPeopleFirst(personIds.map((id) => ({ id }))),
        location: {
          country: searchQuery.country ? { label: searchQuery.country, value: searchQuery.country } : undefined,
          state: searchQuery.state ? { label: searchQuery.state, value: searchQuery.state } : undefined,
          city: searchQuery.city ? { label: searchQuery.city, value: searchQuery.city } : undefined,
        },
        camera: {
          make: searchQuery.make ? { label: searchQuery.make, value: searchQuery.make } : undefined,
          model: searchQuery.model ? { label: searchQuery.model, value: searchQuery.model } : undefined,
        },
        date: {
          takenAfter: searchQuery.takenAfter
            ? DateTime.fromISO(searchQuery.takenAfter).toUTC().toFormat('yyyy-MM-dd')
            : undefined,
          takenBefore: searchQuery.takenBefore
            ? DateTime.fromISO(searchQuery.takenBefore).toUTC().toFormat('yyyy-MM-dd')
            : undefined,
        },
        isArchive: searchQuery.isArchived,
        isFavorite: searchQuery.isFavorite,
        isNotInAlbum: 'isNotInAlbum' in searchQuery ? searchQuery.isNotInAlbum : undefined,
        mediaType:
          searchQuery.type === AssetTypeEnum.Image
            ? MediaType.Image
            : searchQuery.type === AssetTypeEnum.Video
              ? MediaType.Video
              : MediaType.All,
      };
    }
  }
</script>

<div
  bind:clientWidth={filterBoxWidth}
  transition:fly={{ y: 25, duration: 250 }}
  class="absolute w-full rounded-b-3xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-gray-800 dark:bg-immich-dark-gray dark:text-gray-300 px-6 pt-6 overflow-y-auto max-h-[90vh] immich-scrollbar"
>
  <p class="text-xs py-2">FILTERS</p>
  <hr class="border-slate-300 dark:border-slate-700 py-2" />

  <form
    id="search-filter-form relative"
    autocomplete="off"
    class="hover:cursor-auto"
    on:submit|preventDefault={search}
    on:reset|preventDefault={resetForm}
  >
    <!-- PEOPLE -->
    <div id="people-selection" class="my-4">
      <div class="flex justify-between place-items-center gap-6">
        <div class="flex-1">
          <p class="immich-form-label">PEOPLE</p>
        </div>
      </div>

      {#if suggestions.people.length > 0}
        <div class="flex gap-1 mt-4 flex-wrap max-h-[300px] overflow-y-auto immich-scrollbar transition-all">
          {#each peopleList as person (person.id)}
            <button
              type="button"
              class="w-20 text-center rounded-3xl border-2 border-transparent hover:bg-immich-gray dark:hover:bg-immich-dark-primary/20 p-2 transition-all {filter.people.some(
                (p) => p.id === person.id,
              )
                ? 'dark:border-slate-500 border-slate-300 bg-slate-200 dark:bg-slate-800 dark:text-white'
                : ''}"
              on:click={() => handlePeopleSelection(person.id)}
            >
              <ImageThumbnail
                circle
                shadow
                url={getPeopleThumbnailUrl(person.id)}
                altText={person.name}
                widthStyle="100%"
              />
              <p class="mt-2 line-clamp-2 text-sm font-medium dark:text-white">{person.name}</p>
            </button>
          {/each}
        </div>

        <div class="flex justify-center mt-2">
          <Button
            shadow={false}
            color="text-primary"
            type="button"
            class="flex gap-2 place-items-center place-content-center"
            on:click={() => (showAllPeople = !showAllPeople)}
          >
            {#if showAllPeople}
              <span><Icon path={mdiClose} /></span>
              Collapse
            {:else}
              <span><Icon path={mdiArrowRight} /></span>
              See all people
            {/if}
          </Button>
        </div>
      {/if}
    </div>

    <hr class="border-slate-300 dark:border-slate-700" />
    <!-- CONTEXT -->
    <div class="my-4">
      <label class="immich-form-label" for="context">CONTEXT</label>
      <input
        class="immich-form-input hover:cursor-text w-full mt-3"
        type="text"
        id="context"
        name="context"
        placeholder="Sunrise on the beach"
        bind:value={filter.context}
      />
    </div>

    <hr class="border-slate-300 dark:border-slate-700" />
    <!-- LOCATION -->
    <div id="location-selection" class="my-4">
      <p class="immich-form-label">PLACE</p>

      <div class="flex justify-between gap-5 mt-3">
        <div class="w-full">
          <p class="text-sm text-black dark:text-white">Country</p>
          <Combobox
            options={suggestions.country}
            bind:selectedOption={filter.location.country}
            placeholder="Search country..."
            on:click={() => updateSuggestion(SearchSuggestionType.Country, {})}
          />
        </div>

        <div class="w-full">
          <p class="text-sm text-black dark:text-white">State</p>
          <Combobox
            options={suggestions.state}
            bind:selectedOption={filter.location.state}
            placeholder="Search state..."
            on:click={() => updateSuggestion(SearchSuggestionType.State, { country: filter.location.country?.value })}
          />
        </div>

        <div class="w-full">
          <p class="text-sm text-black dark:text-white">City</p>
          <Combobox
            options={suggestions.city}
            bind:selectedOption={filter.location.city}
            placeholder="Search city..."
            on:click={() =>
              updateSuggestion(SearchSuggestionType.City, {
                country: filter.location.country?.value,
                state: filter.location.state?.value,
              })}
          />
        </div>
      </div>
    </div>

    <hr class="border-slate-300 dark:border-slate-700" />
    <!-- CAMERA MODEL -->
    <div id="camera-selection" class="my-4">
      <p class="immich-form-label">CAMERA</p>

      <div class="flex justify-between gap-5 mt-3">
        <div class="w-full">
          <p class="text-sm text-black dark:text-white">Make</p>
          <Combobox
            options={suggestions.make}
            bind:selectedOption={filter.camera.make}
            placeholder="Search camera make..."
            on:click={() =>
              updateSuggestion(SearchSuggestionType.CameraMake, { cameraModel: filter.camera.model?.value })}
          />
        </div>

        <div class="w-full">
          <p class="text-sm text-black dark:text-white">Model</p>
          <Combobox
            options={suggestions.model}
            bind:selectedOption={filter.camera.model}
            placeholder="Search camera model..."
            on:click={() =>
              updateSuggestion(SearchSuggestionType.CameraModel, { cameraMake: filter.camera.make?.value })}
          />
        </div>
      </div>
    </div>

    <hr class="border-slate-300 dark:border-slate-700" />

    <!-- DATE RANGE -->
    <div id="date-range-selection" class="my-4 flex justify-between gap-5">
      <div class="mb-3 flex-1 mt">
        <label class="immich-form-label" for="start-date">START DATE</label>
        <input
          class="immich-form-input w-full mt-3 hover:cursor-pointer"
          type="date"
          id="start-date"
          name="start-date"
          bind:value={filter.date.takenAfter}
        />
      </div>

      <div class="mb-3 flex-1">
        <label class="immich-form-label" for="end-date">END DATE</label>
        <input
          class="immich-form-input w-full mt-3 hover:cursor-pointer"
          type="date"
          id="end-date"
          name="end-date"
          placeholder=""
          bind:value={filter.date.takenBefore}
        />
      </div>
    </div>

    <hr class="border-slate-300 dark:border-slate-700" />
    <div class="py-3 grid grid-cols-[repeat(auto-fill,minmax(21rem,1fr))] gap-x-16 gap-y-8">
      <!-- MEDIA TYPE -->
      <div id="media-type-selection">
        <p class="immich-form-label">MEDIA TYPE</p>

        <div class="flex gap-5 mt-3">
          <label
            for="type-all"
            class="text-base flex place-items-center gap-1 hover:cursor-pointer text-black dark:text-white"
          >
            <input
              bind:group={filter.mediaType}
              value={MediaType.All}
              type="radio"
              name="radio-type"
              id="type-all"
            />All</label
          >

          <label
            for="type-image"
            class="text-base flex place-items-center gap-1 hover:cursor-pointer text-black dark:text-white"
          >
            <input
              bind:group={filter.mediaType}
              value={MediaType.Image}
              type="radio"
              name="media-type"
              id="type-image"
            />Image</label
          >

          <label
            for="type-video"
            class="text-base flex place-items-center gap-1 hover:cursor-pointer text-black dark:text-white"
          >
            <input
              bind:group={filter.mediaType}
              value={MediaType.Video}
              type="radio"
              name="radio-type"
              id="type-video"
            />Video</label
          >
        </div>
      </div>

      <!-- DISPLAY OPTIONS -->
      <div id="display-options-selection">
        <p class="immich-form-label">DISPLAY OPTIONS</p>

        <div class="flex gap-5 mt-3">
          <label class="flex items-center mb-2">
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={filter.isNotInAlbum} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Not in any album</span>
          </label>

          <label class="flex items-center mb-2">
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={filter.isArchive} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Archive</span>
          </label>

          <label class="flex items-center mb-2">
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={filter.isFavorite} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Favorite</span>
          </label>
        </div>
      </div>
    </div>

    <div
      id="button-row"
      class="flex justify-end gap-4 py-4 sticky bottom-0 dark:border-gray-800 dark:bg-immich-dark-gray"
    >
      <Button type="reset" color="gray">CLEAR ALL</Button>
      <Button type="submit">SEARCH</Button>
    </div>
  </form>
</div>
