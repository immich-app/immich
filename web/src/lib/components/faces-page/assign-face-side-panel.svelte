<script lang="ts">
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { getPersonNameWithHiddenValue } from '$lib/utils/person';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { AssetTypeEnum, type AssetFaceResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { mdiArrowLeftThin, mdiClose, mdiMagnify, mdiPlus } from '@mdi/js';
  import { linear } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { photoViewer } from '$lib/stores/assets.store';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import SearchPeople from '$lib/components/faces-page/people-search.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { zoomImageToBase64 } from '$lib/utils/people-utils';
  import { t } from 'svelte-i18n';

  export let allPeople: PersonResponseDto[];
  export let editedFace: AssetFaceResponseDto;
  export let assetId: string;
  export let assetType: AssetTypeEnum;
  export let onClose: () => void;
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

  const handleCreatePerson = async () => {
    const timeout = setTimeout(() => (isShowLoadingNewPerson = true), timeBeforeShowLoadingSpinner);

    const newFeaturePhoto = await zoomImageToBase64(editedFace, assetId, assetType, $photoViewer);

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
        <CircleIconButton icon={mdiArrowLeftThin} title={$t('back')} on:click={onClose} />
        <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">{$t('select_face')}</p>
      </div>
      <div class="flex justify-end gap-2">
        <CircleIconButton
          icon={mdiMagnify}
          title={$t('search_for_existing_person')}
          on:click={() => {
            searchFaces = true;
          }}
        />
        {#if !isShowLoadingNewPerson}
          <CircleIconButton icon={mdiPlus} title={$t('create_new_person')} on:click={handleCreatePerson} />
        {:else}
          <div class="flex place-content-center place-items-center">
            <LoadingSpinner />
          </div>
        {/if}
      </div>
    {:else}
      <CircleIconButton icon={mdiArrowLeftThin} title={$t('back')} on:click={onClose} />
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
      <CircleIconButton icon={mdiClose} title={$t('cancel_search')} on:click={() => (searchFaces = false)} />
    {/if}
  </div>
  <div class="px-4 py-4 text-sm">
    <h2 class="mb-8 mt-4 uppercase">{$t('all_people')}</h2>
    <div class="immich-scrollbar mt-4 flex flex-wrap gap-2 overflow-y-auto">
      {#each showPeople as person (person.id)}
        {#if !editedFace.person || person.id !== editedFace.person.id}
          <div class="w-fit">
            <button type="button" class="w-[90px]" on:click={() => onReassign(person)}>
              <div class="relative">
                <ImageThumbnail
                  curve
                  shadow
                  url={getPeopleThumbnailUrl(person)}
                  altText={$getPersonNameWithHiddenValue(person.name, person.isHidden)}
                  title={$getPersonNameWithHiddenValue(person.name, person.isHidden)}
                  widthStyle="90px"
                  heightStyle="90px"
                  hidden={person.isHidden}
                />
              </div>

              <p class="mt-1 truncate font-medium" title={$getPersonNameWithHiddenValue(person.name, person.isHidden)}>
                {person.name}
              </p>
            </button>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</section>
