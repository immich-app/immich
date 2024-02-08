<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { fly } from 'svelte/transition';
  import Combobox, { type ComboBoxOption } from '../combobox.svelte';
  import { SearchSuggestionType, api, type PersonResponseDto } from '@api';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiClose } from '@mdi/js';

  enum MediaType {
    All = 'all',
    Image = 'image',
    Video = 'video',
  }

  let startDate: Date | undefined = undefined;
  let endDate: Date | undefined = undefined;

  let mediaType: MediaType = MediaType.All;
  let notInAlbum = false;
  let inArchive = false;
  let inFavorite = false;

  // People Suggestion
  let peopleSuggestions: PersonResponseDto[] = [];
  let peopleComboboxOptions: ComboBoxOption[] = [];
  let peopleSelected: PersonResponseDto[] = [];

  const getPeopleSuggestion = async () => {
    if (peopleSuggestions.length > 0) return;

    const { data } = await api.searchApi.getSearchSuggestions({ type: SearchSuggestionType.People });

    data.people?.forEach((person) => {
      peopleComboboxOptions = [...peopleComboboxOptions, { label: person.name, value: person.id }];
      peopleSuggestions = [...peopleSuggestions, person];
    });
  };

  const onPeopleSelected = (option: ComboBoxOption) => {
    const selectedPerson = peopleSuggestions.find((person) => person.id === option.value);
    if (selectedPerson) {
      peopleSelected = [...peopleSelected, selectedPerson];
    }
    peopleComboboxOptions = peopleComboboxOptions.filter((person) => person.value !== option.value);
  };

  const onDeselectPerson = (id: string) => {
    peopleSelected = peopleSelected.filter((person) => person.id !== id);
    const person = peopleSuggestions.find((person) => person.id === id);
    if (person) {
      peopleComboboxOptions = [...peopleComboboxOptions, { label: person.name, value: person.id }];
    }
  };

  // Country Suggestions
  let countrySuggestions: ComboBoxOption[] = [];
  let stateSuggestions: ComboBoxOption[] = [];
  let citySuggestions: ComboBoxOption[] = [];

  let selectedCountry: ComboBoxOption = { label: '', value: '' };
  let selectedState: ComboBoxOption = { label: '', value: '' };
  let selectedCity: ComboBoxOption = { label: '', value: '' };

  const getLocationSuggestions = async (type: SearchSuggestionType) => {
    countrySuggestions = [];
    stateSuggestions = [];
    citySuggestions = [];

    const { data } = await api.searchApi.getSearchSuggestions({
      type: type,
      country: selectedCountry.value,
      state: selectedState.value,
    });

    data.data?.forEach((item) => {
      if (type === SearchSuggestionType.Country) {
        countrySuggestions = [...countrySuggestions, { label: item, value: item }];
      } else if (type === SearchSuggestionType.State) {
        stateSuggestions = [...stateSuggestions, { label: item, value: item }];
      } else if (type === SearchSuggestionType.City) {
        citySuggestions = [...citySuggestions, { label: item, value: item }];
      }
    });
  };

  const onCountrySelected = (option: ComboBoxOption) => {
    console.log(option.value, selectedCountry.value);
    if (option.value != selectedCountry.value) {
      selectedState = { label: '', value: '' };
      selectedCity = { label: '', value: '' };
    }

    selectedCountry = option;
  };

  const onStateSelected = (option: ComboBoxOption) => {
    selectedState = option;
  };

  const onCitySelected = (option: ComboBoxOption) => {
    selectedCity = option;
  };

  // Camera Suggestion
  let cameraMakeSuggestions: ComboBoxOption[] = [];
  let cameraModelSuggestions: ComboBoxOption[] = [];
  let selectedMake: ComboBoxOption = { label: '', value: '' };
  let selectedModel: ComboBoxOption = { label: '', value: '' };

  const getCameraSuggestions = async (type: SearchSuggestionType) => {
    cameraMakeSuggestions = [];
    cameraModelSuggestions = [];

    console.log(selectedMake, selectedModel, type)
    const { data } = await api.searchApi.getSearchSuggestions({
      type,
      make: selectedMake.value,
      model: selectedModel.value,
    });

    data.data?.forEach((item) => {
      if (type === SearchSuggestionType.CameraMake) {
        cameraMakeSuggestions = [...cameraMakeSuggestions, { label: item, value: item }];
      } else if (type === SearchSuggestionType.CameraModel) {
        cameraModelSuggestions = [...cameraModelSuggestions, { label: item, value: item }];
      }
    });
  };

  const onMakeSelected = (option: ComboBoxOption) => {
    console.log(option);
    selectedMake = option;
  };

  const onModelSelected = (option: ComboBoxOption) => {
    selectedModel = option;
  };

  const resetForm = () => {
    mediaType = MediaType.All;

    notInAlbum = false;
    inArchive = false;
    inFavorite = false;

    peopleSelected = [];
    peopleComboboxOptions = [];
    peopleSuggestions = [];

    countrySuggestions = [];
    stateSuggestions = [];
    citySuggestions = [];
    selectedCountry = { label: '', value: '' };
    selectedState = { label: '', value: '' };
    selectedCity = { label: '', value: '' };

    cameraMakeSuggestions = [];
    cameraModelSuggestions = [];
    selectedMake = { label: '', value: '' };
    selectedModel = { label: '', value: '' };

    startDate = undefined;
    endDate = undefined;
  };
</script>

<div
  transition:fly={{ y: 25, duration: 250 }}
  class="absolute w-full rounded-b-3xl border border-gray-200 bg-white pb-5 shadow-2xl transition-all dark:border-gray-800 dark:bg-immich-dark-gray dark:text-gray-300 p-6"
>
  <p class="text-xs py-2">FILTERS</p>
  <hr class="py-2" />

  <form id="search-filter-form" autocomplete="off" class="hover:cursor-auto">
    <div class="py-3">
      <label class="immich-form-label" for="context">CONTEXT</label>
      <input
        class="immich-form-input hover:cursor-text w-full mt-3"
        type="text"
        id="context"
        name="context"
        placeholder="Sunrise on the beach"
      />
    </div>

    <div class="py-3 grid grid-cols-2">
      <!-- MEDIA TYPE -->
      <div id="media-type-selection">
        <p class="immich-form-label">MEDIA TYPE</p>

        <div class="flex gap-5 mt-3">
          <label
            for="type-all"
            class="text-base flex place-items-center gap-1 hover:cursor-pointer text-black dark:text-white"
          >
            <input bind:group={mediaType} value={mediaType} type="radio" name="radio-type" id="type-all" />All</label
          >

          <label
            for="type-image"
            class="text-base flex place-items-center gap-1 hover:cursor-pointer text-black dark:text-white"
          >
            <input
              bind:group={mediaType}
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
              bind:group={mediaType}
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
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={notInAlbum} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Not in any album</span>
          </label>

          <label class="flex items-center mb-2">
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={inArchive} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Archive</span>
          </label>

          <label class="flex items-center mb-2">
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={inFavorite} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Favorite</span>
          </label>
        </div>
      </div>
    </div>

    <hr />

    <!-- PEOPLE -->
    <div id="people-selection" class="my-4">
      <div class="flex justify-between place-items-center gap-6">
        <div class="flex-1">
          <p class="immich-form-label">PEOPLE</p>
        </div>

        <div class="flex-1">
          <Combobox
            noLabel
            options={peopleComboboxOptions}
            placeholder="Search people..."
            on:click={getPeopleSuggestion}
            on:select={({ detail }) => onPeopleSelected(detail)}
          />
        </div>
      </div>

      <div class="flex gap-4 mt-4">
        {#each peopleSelected as person (person.id)}
          <button
            class="flex gap-2 place-items-center place-content-center rounded-full bg-immich-primary/20 dark:bg-immich-dark-primary/75 px-2 py-1 text-black hover:bg-immich-primary/40 dark:hover:dark:bg-immich-dark-primary transition-all"
            on:click={() => onDeselectPerson(person.id)}
          >
            <ImageThumbnail
              circle
              shadow
              url={api.getPeopleThumbnailUrl(person.id)}
              altText={person.name}
              widthStyle="36px"
            />

            <p>{person.name}</p>

            <Icon path={mdiClose} class="hover:cursor-pointer" />
          </button>
        {/each}
      </div>
    </div>

    <hr />
    <!-- LOCATION -->
    <div id="location-selection" class="my-4">
      <p class="immich-form-label">PLACE</p>

      <div class="flex justify-between gap-5 mt-3">
        <div class="w-full">
          <p class="text-sm text-black dark:text-white">Country</p>
          <Combobox
            options={countrySuggestions}
            selectedOption={selectedCountry}
            placeholder="Search country..."
            on:click={() => getLocationSuggestions(SearchSuggestionType.Country)}
            on:select={({ detail }) => onCountrySelected(detail)}
          />
        </div>

        <div class="w-full">
          <p class="text-sm text-black dark:text-white">State</p>
          <Combobox
            options={stateSuggestions}
            selectedOption={selectedState}
            placeholder="Search state..."
            on:click={() => getLocationSuggestions(SearchSuggestionType.State)}
            on:select={({ detail }) => onStateSelected(detail)}
          />
        </div>

        <div class="w-full">
          <p class="text-sm text-black dark:text-white">City</p>
          <Combobox
            options={citySuggestions}
            selectedOption={selectedCity}
            placeholder="Search city..."
            on:click={() => getLocationSuggestions(SearchSuggestionType.City)}
            on:select={({ detail }) => onCitySelected(detail)}
          />
        </div>
      </div>
    </div>

    <hr />
    <!-- CAMERA MODEL -->
    <div id="camera-selection" class="my-4">
      <p class="immich-form-label">CAMERA</p>

      <div class="flex justify-between gap-5 mt-3">
        <div class="w-full">
          <p class="text-sm text-black dark:text-white">Make</p>
          <Combobox
            options={cameraMakeSuggestions}
            selectedOption={selectedMake}
            placeholder="Search camera make..."
            on:click={() => getCameraSuggestions(SearchSuggestionType.CameraMake)}
            on:select={({ detail }) => onMakeSelected(detail)}
          />
        </div>

        <div class="w-full">
          <p class="text-sm text-black dark:text-white">Model</p>
          <Combobox
            options={cameraModelSuggestions}
            selectedOption={selectedModel}
            placeholder="Search camera model..."
            on:click={() => getCameraSuggestions(SearchSuggestionType.CameraModel)}
            on:select={({ detail }) => onModelSelected(detail)}
          />
        </div>
      </div>
    </div>

    <hr />

    <!-- DATE RANGE -->
    <div id="date-range-selection" class="my-4 flex justify-between gap-5">
      <div class="mb-3 flex-1 mt">
        <label class="immich-form-label" for="start-date">START DATE</label>
        <input
          class="immich-form-input w-full mt-3 hover:cursor-pointer"
          type="date"
          id="start-date"
          name="start-date"
          bind:value={startDate}
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
          bind:value={endDate}
        />
      </div>
    </div>

    <div id="button-row" class="flex justify-end gap-4 mt-5">
      <Button color="gray" on:click={resetForm}>CLEAR ALL</Button>
      <Button type="submit">SEARCH</Button>
    </div>
  </form>
</div>
