<script lang="ts" context="module">
  import type { SearchLocationFilter } from './search-location-section.svelte';

  export enum MediaType {
    All = 'all',
    Image = 'image',
    Video = 'video',
  }

  export type SearchFilter = {
    context?: string;
    personIds: Set<string>;

    location: SearchLocationFilter;

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

  export type SearchParams = {
    state?: string;
    country?: string;
    city?: string;
    cameraMake?: string;
    cameraModel?: string;
  };
</script>

<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetTypeEnum, type SmartSearchDto, type MetadataSearchDto, SearchSuggestionType } from '@immich/sdk';
  import { getSearchSuggestions } from '@immich/sdk';
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { type ComboBoxOption } from '../combobox.svelte';
  import SearchPeopleSection from './search-people-section.svelte';
  import SearchLocationSection from './search-location-section.svelte';
  import SearchCameraSection from './search-camera-section.svelte';
  import SearchDateSection from './search-date-section.svelte';
  import SearchMediaSection from './search-media-section.svelte';
  import { parseUtcDate } from '$lib/utils/date-time';

  type SearchSuggestion = {
    make: ComboBoxOption[];
    model: ComboBoxOption[];
  };

  export let searchQuery: MetadataSearchDto | SmartSearchDto;

  let suggestions: SearchSuggestion = {
    make: [],
    model: [],
  };

  let filter: SearchFilter = {
    context: undefined,
    personIds: new Set(),
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

  let filterBoxWidth = 0;

  onMount(() => {
    updateSuggestions();
    populateExistingFilters();
  });

  const updateSuggestions = async () => {
    let data: {
      makes: ComboBoxOption[];
      models: ComboBoxOption[];
    };
    try {
      const makes = await getSearchSuggestions({
        $type: SearchSuggestionType.CameraMake,
        model: filter.camera.model?.value,
      });
      const models = await getSearchSuggestions({
        $type: SearchSuggestionType.CameraModel,
        make: filter.camera.make?.value,
      });

      data = {
        makes: makes.map<ComboBoxOption>((item) => ({ label: item, value: item })),
        models: models.map<ComboBoxOption>((item) => ({ label: item, value: item })),
      };
    } catch (error) {
      handleError(error, 'Failed to get search suggestions');
      return;
    }
    suggestions = {
      ...suggestions,
      make: data.makes,
      model: data.models,
    };
  };

  const resetForm = () => {
    filter = {
      context: undefined,
      personIds: new Set(),
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
      country: filter.location.country,
      state: filter.location.state,
      city: filter.location.city,
      make: filter.camera.make?.value,
      model: filter.camera.model?.value,
      takenAfter: parseOptionalDate(filter.date.takenAfter)?.startOf('day').toISO() || undefined,
      takenBefore: parseOptionalDate(filter.date.takenBefore)?.endOf('day').toISO() || undefined,
      isArchived: filter.isArchive || undefined,
      isFavorite: filter.isFavorite || undefined,
      isNotInAlbum: filter.isNotInAlbum || undefined,
      personIds: filter.personIds.size > 0 ? [...filter.personIds] : undefined,
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
        personIds: new Set(personIds),
        location: {
          country: searchQuery.country,
          state: searchQuery.state,
          city: searchQuery.city,
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
      <SearchPeopleSection width={filterBoxWidth} bind:selectedPeople={filter.personIds} />

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
      <SearchLocationSection bind:filter={filter.location} />

      <!-- CAMERA MODEL -->
      <SearchCameraSection
        suggestedMakes={suggestions.make}
        suggestedModels={suggestions.model}
        bind:filteredCamera={filter.camera}
        {updateSuggestions}
      />

      <!-- DATE RANGE -->
      <SearchDateSection bind:filteredDate={filter.date} />

      <div class="grid md:grid-cols-2 gap-x-5 gap-y-8">
        <!-- MEDIA TYPE -->
        <SearchMediaSection bind:filteredMedia={filter.mediaType} />

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
