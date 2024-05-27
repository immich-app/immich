<script lang="ts">
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { getPersonNameWithHiddenValue, zoomImageToBase64 } from '$lib/utils/person';
  import { AssetTypeEnum, type AssetFaceResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { mdiAccountOff, mdiArrowLeftThin, mdiClose, mdiMagnify, mdiPlus } from '@mdi/js';
  import { linear } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import SearchPeople from '$lib/components/faces-page/people-search.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Icon from '$lib/components/elements/icon.svelte';

  export let editedFace: AssetFaceResponseDto;
  export let allPeople: PersonResponseDto[];
  export let assetType: AssetTypeEnum;
  export let assetId: string;
  export let editedPerson: PersonResponseDto | undefined = undefined;
  export let onClose = () => {};
  export let onCreatePerson: (featurePhoto: string | null) => void;
  export let onReassign: (person: PersonResponseDto) => void;

  // loading spinners
  let isShowLoadingNewPerson = false;
  let isShowLoadingSearch = false;

  // search people
  let searchedPeople: PersonResponseDto[] = [];
  let searchFaces = false;
  let searchName = '';

  $: showPeople = searchName ? searchedPeople : allPeople.filter((person) => !person.isHidden);

  const handleBackButton = () => {
    onClose();
  };

  const handleCreatePerson = async () => {
    const timeout = setTimeout(() => (isShowLoadingNewPerson = true), timeBeforeShowLoadingSpinner);

    const newFeaturePhoto = await zoomImageToBase64(editedFace, assetType, assetId);

    onCreatePerson(newFeaturePhoto);

    clearTimeout(timeout);
    isShowLoadingNewPerson = false;
    onCreatePerson(newFeaturePhoto);
  };
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 z-[2001] h-full w-[360px] overflow-x-hidden p-2 bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
>
  <div class="flex place-items-center justify-between gap-2">
    {#if !searchFaces}
      <div class="flex items-center gap-2">
        <CircleIconButton icon={mdiArrowLeftThin} title="Back" on:click={handleBackButton} />
        <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">Select face</p>
      </div>
      <div class="flex justify-end gap-2">
        <CircleIconButton
          icon={mdiMagnify}
          title="Search for existing person"
          on:click={() => {
            searchFaces = true;
          }}
        />
        {#if !isShowLoadingNewPerson}
          <CircleIconButton icon={mdiPlus} title="Create new person" on:click={handleCreatePerson} />
        {:else}
          <div class="flex place-content-center place-items-center">
            <LoadingSpinner />
          </div>
        {/if}
      </div>
    {:else}
      <CircleIconButton icon={mdiArrowLeftThin} title="Back" on:click={handleBackButton} />
      <div class="w-full flex">
        <SearchPeople
          type="input"
          bind:searchName
          bind:showLoadingSpinner={isShowLoadingSearch}
          bind:searchedPeopleLocal={searchedPeople}
        />
        {#if isShowLoadingSearch}
          <div>
            <LoadingSpinner />
          </div>
        {/if}
      </div>
      <CircleIconButton icon={mdiClose} title="Cancel search" on:click={() => (searchFaces = false)} />
    {/if}
  </div>
  <div class="px-4 py-4 text-sm">
    {#if showPeople.length > 0}
      <h2 class="mb-8 mt-4 uppercase">All people</h2>
      <div class="immich-scrollbar mt-4 flex flex-wrap gap-2 overflow-y-auto">
        {#each showPeople as person (person.id)}
          {#if person.id !== editedPerson?.id}
            <div class="w-fit">
              <button type="button" class="w-[90px]" on:click={() => onReassign(person)}>
                <div class="relative">
                  <ImageThumbnail
                    curve
                    shadow
                    url={getPeopleThumbnailUrl(person.id)}
                    altText={getPersonNameWithHiddenValue(person.name, person.isHidden)}
                    title={getPersonNameWithHiddenValue(person.name, person.isHidden)}
                    widthStyle="90px"
                    heightStyle="90px"
                    thumbhash={null}
                    hidden={person.isHidden}
                  />
                </div>

                <p class="mt-1 truncate font-medium" title={getPersonNameWithHiddenValue(person.name, person.isHidden)}>
                  {person.name}
                </p>
              </button>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div class="flex items-center justify-center">
        <div class="grid place-items-center">
          <Icon path={mdiAccountOff} size="3.5em" />
          <p class="mt-5 font-medium">No faces found</p>
        </div>
      </div>
    {/if}
  </div>
</section>
