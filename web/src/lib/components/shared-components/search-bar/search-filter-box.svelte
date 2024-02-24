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
  import { parseUtcDate } from '$lib/utils/date-time';

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

  const parseOptionalDate = (dateString?: string) => (dateString ? parseUtcDate(dateString) : undefined);
  const toStartOfDayDate = (dateString: string) => parseUtcDate(dateString)?.startOf('day').toISODate() || undefined;

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
      takenAfter: parseOptionalDate(filter.date.takenAfter)?.startOf('day').toISO() || undefined,
      takenBefore: parseOptionalDate(filter.date.takenBefore)?.endOf('day').toISO() || undefined,
      isArchived: filter.isArchive || undefined,
      isFavorite: filter.isFavorite || undefined,
      isNotInAlbum: filter.isNotInAlbum || undefined,
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
          takenAfter: searchQuery.takenAfter ? toStartOfDayDate(searchQuery.takenAfter) : undefined,
          takenBefore: searchQuery.takenBefore ? toStartOfDayDate(searchQuery.takenBefore) : undefined,
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
  class="absolute w-full rounded-b-3xl border border-t-0 border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-immich-dark-gray dark:text-gray-300"
>
  <form
    id="search-filter-form"
    autocomplete="off"
    on:submit|preventDefault={search}
    on:reset|preventDefault={resetForm}
  >
    <div class="px-4 sm:px-6 py-4 space-y-10 max-h-[calc(100dvh-12rem)] overflow-y-auto immich-scrollbar">
      <!-- PEOPLE -->
      {#if suggestions.people.length > 0}
        <div id="people-selection" class="-mb-4">
          <div class="flex items-center gap-6">
            <p class="immich-form-label">PEOPLE</p>
          </div>

          <div class="flex -mx-1 max-h-64 gap-1 mt-2 flex-wrap overflow-y-auto immich-scrollbar">
            {#each peopleList as person (person.id)}
              <button
                type="button"
                class="w-20 text-center rounded-3xl border-2 border-transparent hover:bg-immich-gray dark:hover:bg-immich-dark-primary/20 p-2 transition-all {filter.people.some(
                  (p) => p.id === person.id,
                )
                  ? 'dark:border-slate-500 border-slate-400 bg-slate-200 dark:bg-slate-800 dark:text-white'
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

          {#if showAllPeople || suggestions.people.length > peopleList.length}
            <div class="flex justify-center mt-2">
              <Button
                shadow={false}
                color="text-primary"
                class="flex gap-2 place-items-center"
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
      {/if}

      <!-- CONTEXT -->
      <div>
        <label class="immich-form-label" for="context">
          <span>CONTEXT</span>
          <input
            class="immich-form-input hover:cursor-text w-full mt-1"
            type="text"
            id="context"
            name="context"
            placeholder="Sunrise on the beach"
            bind:value={filter.context}
          />
        </label>
      </div>

      <!-- LOCATION -->
      <div id="location-selection">
        <p class="immich-form-label">PLACE</p>

        <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-5 mt-1">
          <div class="w-full">
            <label class="text-sm text-black dark:text-white" for="search-place-country">Country</label>
            <Combobox
              id="search-place-country"
              options={suggestions.country}
              bind:selectedOption={filter.location.country}
              placeholder="Search country..."
              on:click={() => updateSuggestion(SearchSuggestionType.Country, {})}
            />
          </div>

          <div class="w-full">
            <label class="text-sm text-black dark:text-white" for="search-place-state">State</label>
            <Combobox
              id="search-place-state"
              options={suggestions.state}
              bind:selectedOption={filter.location.state}
              placeholder="Search state..."
              on:click={() => updateSuggestion(SearchSuggestionType.State, { country: filter.location.country?.value })}
            />
          </div>

          <div class="w-full">
            <label class="text-sm text-black dark:text-white" for="search-place-city">City</label>
            <Combobox
              id="search-place-city"
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

      <!-- CAMERA MODEL -->
      <div id="camera-selection">
        <p class="immich-form-label">CAMERA</p>

        <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-5 mt-1">
          <div class="w-full">
            <label class="text-sm text-black dark:text-white" for="search-camera-make">Make</label>
            <Combobox
              id="search-camera-make"
              options={suggestions.make}
              bind:selectedOption={filter.camera.make}
              placeholder="Search camera make..."
              on:click={() =>
                updateSuggestion(SearchSuggestionType.CameraMake, { cameraModel: filter.camera.model?.value })}
            />
          </div>

          <div class="w-full">
            <label class="text-sm text-black dark:text-white" for="search-camera-model">Model</label>
            <Combobox
              id="search-camera-model"
              options={suggestions.model}
              bind:selectedOption={filter.camera.model}
              placeholder="Search camera model..."
              on:click={() =>
                updateSuggestion(SearchSuggestionType.CameraModel, { cameraMake: filter.camera.make?.value })}
            />
          </div>
        </div>
      </div>

      <!-- DATE RANGE -->
      <div id="date-range-selection" class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-5">
        <label class="immich-form-label" for="start-date">
          <span>START DATE</span>
          <input
            class="immich-form-input w-full mt-1 hover:cursor-pointer"
            type="date"
            id="start-date"
            name="start-date"
            max={filter.date.takenBefore}
            bind:value={filter.date.takenAfter}
          />
        </label>

        <label class="immich-form-label" for="end-date">
          <span>END DATE</span>
          <input
            class="immich-form-input w-full mt-1 hover:cursor-pointer"
            type="date"
            id="end-date"
            name="end-date"
            placeholder=""
            min={filter.date.takenAfter}
            bind:value={filter.date.takenBefore}
          />
        </label>
      </div>

      <div class="grid md:grid-cols-2 gap-x-5 gap-y-8">
        <!-- MEDIA TYPE -->
        <div id="media-type-selection">
          <p class="immich-form-label">MEDIA TYPE</p>

          <div class="flex gap-5 mt-1 text-base">
            <label for="type-all" class="flex items-center gap-1">
              <input
                bind:group={filter.mediaType}
                value={MediaType.All}
                type="radio"
                name="radio-type"
                id="type-all"
                class="size-4"
              />
              <span class="pt-0.5">All</span>
            </label>

            <label for="type-image" class="flex items-center gap-1">
              <input
                bind:group={filter.mediaType}
                value={MediaType.Image}
                type="radio"
                name="media-type"
                id="type-image"
                class="size-4"
              />
              <span class="pt-0.5">Image</span>
            </label>

            <label for="type-video" class="flex items-center gap-1">
              <input
                bind:group={filter.mediaType}
                value={MediaType.Video}
                type="radio"
                name="radio-type"
                id="type-video"
                class="size-4"
              />
              <span class="pt-0.5">Video</span>
            </label>
          </div>
        </div>

        <!-- DISPLAY OPTIONS -->
        <div id="display-options-selection" class="text-sm">
          <p class="immich-form-label">DISPLAY OPTIONS</p>

          <div class="flex flex-wrap gap-x-5 gap-y-2 mt-1">
            <label class="flex items-center gap-2">
              <input type="checkbox" class="size-5 flex-shrink-0" bind:checked={filter.isNotInAlbum} />
              <span class="pt-1">Not in any album</span>
            </label>

            <label class="flex items-center gap-2">
              <input type="checkbox" class="size-5 flex-shrink-0" bind:checked={filter.isArchive} />
              <span class="pt-1">Archive</span>
            </label>

            <label class="flex items-center gap-2">
              <input type="checkbox" class="size-5 flex-shrink-0" bind:checked={filter.isFavorite} />
              <span class="pt-1">Favorite</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div
      id="button-row"
      class="flex justify-end gap-4 border-t dark:border-gray-800 dark:bg-immich-dark-gray px-4 sm:py-6 py-4 mt-2 rounded-b-3xl"
    >
      <Button type="reset" color="gray">CLEAR ALL</Button>
      <Button type="submit">SEARCH</Button>
    </div>
  </form>
</div>
