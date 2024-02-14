<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { fly } from 'svelte/transition';
  import Combobox, { type ComboBoxOption } from '../combobox.svelte';
  import { SearchSuggestionType, api, type PersonResponseDto } from '@api';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiArrowRight, mdiClose } from '@mdi/js';
  import { handleError } from '$lib/utils/handle-error';
  import { onMount } from 'svelte';

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
    cameraMake: ComboBoxOption[];
    cameraModel: ComboBoxOption[];
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
    people: PersonResponseDto[];

    location: {
      country?: ComboBoxOption;
      state?: ComboBoxOption;
      city?: ComboBoxOption;
    };

    camera: {
      make?: ComboBoxOption;
      model?: ComboBoxOption;
    };

    dateRange: {
      startDate?: Date;
      endDate?: Date;
    };

    inArchive?: boolean;
    inFavorite?: boolean;
    notInAlbum?: boolean;

    mediaType: MediaType;
  };

  let suggestions: SearchSuggestion = {
    people: [],
    country: [],
    state: [],
    city: [],
    cameraMake: [],
    cameraModel: [],
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
    dateRange: {
      startDate: undefined,
      endDate: undefined,
    },
    inArchive: undefined,
    inFavorite: undefined,
    notInAlbum: undefined,
    mediaType: MediaType.All,
  };

  let showAllPeople = false;
  $: peopleList = showAllPeople ? suggestions.people : suggestions.people.slice(0, 11);

  onMount(() => {
    getPeople();
  });

  const showSelectedPeopleFirst = () => {
    suggestions.people.sort((a, _) => {
      if (filter.people.some((p) => p.id === a.id)) {
        return -1;
      }
      return 1;
    });
  };

  const getPeople = async () => {
    try {
      const { data } = await api.personApi.getAllPeople({ withHidden: false });
      suggestions.people = data.people;
    } catch (error) {
      handleError(error, 'Failed to get people');
    }
  };

  const handlePeopleSelection = (id: string) => {
    if (filter.people.some((p) => p.id === id)) {
      filter.people = filter.people.filter((p) => p.id !== id);
      showSelectedPeopleFirst();
      return;
    }

    const person = suggestions.people.find((p) => p.id === id);
    if (person) {
      filter.people = [...filter.people, person];
      showSelectedPeopleFirst();
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
      suggestions = { ...suggestions, cameraMake: [], cameraModel: [] };
    }

    try {
      const { data } = await api.searchApi.getSearchSuggestions({
        type: type,
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
            suggestions.cameraMake = [...suggestions.cameraMake, { label: make, value: make }];
          }
          break;
        }

        case SearchSuggestionType.CameraModel: {
          for (const model of data) {
            suggestions.cameraModel = [...suggestions.cameraModel, { label: model, value: model }];
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
      dateRange: {
        startDate: undefined,
        endDate: undefined,
      },
      inArchive: undefined,
      inFavorite: undefined,
      notInAlbum: undefined,
      mediaType: MediaType.All,
    };
  };

  const search = () => {};
</script>

<div
  transition:fly={{ y: 25, duration: 250 }}
  class="absolute w-full rounded-b-3xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-gray-800 dark:bg-immich-dark-gray dark:text-gray-300 px-6 pt-6 overflow-y-auto max-h-[90vh] immich-scrollbar"
>
  <p class="text-xs py-2">FILTERS</p>
  <hr class="border-slate-300 dark:border-slate-700 py-2" />

  <form id="search-filter-form relative" autocomplete="off" class="hover:cursor-auto">
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
              class="w-20 text-center rounded-3xl border-2 border-transparent hover:bg-immich-gray dark:hover:bg-immich-dark-primary/20 p-2 flex-col place-items-center transition-all {filter.people.some(
                (p) => p.id === person.id,
              )
                ? 'dark:border-slate-500 border-slate-300 bg-slate-200 dark:bg-slate-800 dark:text-white'
                : ''}"
              on:click={() => handlePeopleSelection(person.id)}
            >
              <ImageThumbnail
                circle
                shadow
                url={api.getPeopleThumbnailUrl(person.id)}
                altText={person.name}
                widthStyle="100px"
              />
              <p class="mt-2 text-ellipsis text-sm font-medium dark:text-white">{person.name}</p>
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
            options={suggestions.cameraMake}
            bind:selectedOption={filter.camera.make}
            placeholder="Search camera make..."
            on:click={() =>
              updateSuggestion(SearchSuggestionType.CameraMake, { cameraModel: filter.camera.model?.value })}
          />
        </div>

        <div class="w-full">
          <p class="text-sm text-black dark:text-white">Model</p>
          <Combobox
            options={suggestions.cameraModel}
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
          bind:value={filter.dateRange.startDate}
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
          bind:value={filter.dateRange.endDate}
        />
      </div>
    </div>

    <hr class="border-slate-300 dark:border-slate-700" />
    <div class="py-3 grid grid-cols-2">
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
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={filter.notInAlbum} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Not in any album</span>
          </label>

          <label class="flex items-center mb-2">
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={filter.inArchive} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Archive</span>
          </label>

          <label class="flex items-center mb-2">
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={filter.inFavorite} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Favorite</span>
          </label>
        </div>
      </div>
    </div>

    <div
      id="button-row"
      class="flex justify-end gap-4 py-4 sticky bottom-0 dark:border-gray-800 dark:bg-immich-dark-gray"
    >
      <Button color="gray" on:click={resetForm}>CLEAR ALL</Button>
      <Button type="button" on:click={search}>SEARCH</Button>
    </div>
  </form>
</div>
