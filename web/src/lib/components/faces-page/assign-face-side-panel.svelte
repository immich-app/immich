<script lang="ts">
  import SearchPeople from '$lib/components/faces-page/people-search.svelte';
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { getPeopleThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { zoomImageToBase64 } from '$lib/utils/people-utils';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { getPersonNameWithHiddenValue } from '$lib/utils/person';
  import { AssetTypeEnum, getAllPeople, type AssetFaceResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { IconButton, LoadingSpinner } from '@immich/ui';
  import { mdiArrowLeftThin, mdiClose, mdiMagnify, mdiPlus } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { linear } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';

  interface Props {
    editedFace: AssetFaceResponseDto;
    assetId: string;
    assetType: AssetTypeEnum;
    onClose: () => void;
    onCreatePerson: (featurePhoto: string | null) => void;
    onReassign: (person: PersonResponseDto) => void;
  }

  let { editedFace, assetId, assetType, onClose, onCreatePerson, onReassign }: Props = $props();

  let allPeople: PersonResponseDto[] = $state([]);

  let isShowLoadingPeople = $state(false);

  async function loadPeople() {
    const timeout = setTimeout(() => (isShowLoadingPeople = true), timeBeforeShowLoadingSpinner);
    try {
      const { people } = await getAllPeople({ withHidden: true, closestAssetId: editedFace.id });
      allPeople = people;
    } catch (error) {
      handleError(error, $t('errors.cant_get_faces'));
    } finally {
      clearTimeout(timeout);
    }
    isShowLoadingPeople = false;
  }

  // loading spinners
  let isShowLoadingNewPerson = $state(false);
  let isShowLoadingSearch = $state(false);

  // search people
  let searchedPeople: PersonResponseDto[] = $state([]);
  let searchFaces = $state(false);
  let searchName = $state('');
  let hoveredPersonId = $state<string | null>(null);
  let showPeople = $derived(searchName ? searchedPeople : allPeople.filter((person) => !person.isHidden));

  const focusHighlightClass =
    'group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-immich-primary dark:group-focus-visible:outline-immich-dark-primary';

  onMount(() => {
    $boundingBoxesArray = [editedFace];
    handlePromiseError(loadPeople());
  });

  onDestroy(() => {
    $boundingBoxesArray = [];
  });

  const handleCreatePerson = async () => {
    const timeout = setTimeout(() => (isShowLoadingNewPerson = true), timeBeforeShowLoadingSpinner);

    const newFeaturePhoto = await zoomImageToBase64(editedFace, assetId, assetType, assetViewerManager.imgRef);

    clearTimeout(timeout);
    isShowLoadingNewPerson = false;
    onCreatePerson(newFeaturePhoto);
  };
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 h-full w-90 overflow-x-hidden p-2 dark:text-immich-dark-fg bg-light"
>
  <div class="flex place-items-center justify-between gap-2">
    {#if !searchFaces}
      <div class="flex items-center gap-2">
        <IconButton
          color="secondary"
          variant="ghost"
          shape="round"
          icon={mdiArrowLeftThin}
          aria-label={$t('back')}
          onclick={onClose}
        />
        <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">{$t('select_face')}</p>
      </div>
      <div class="flex justify-end gap-2">
        <IconButton
          color="secondary"
          variant="ghost"
          shape="round"
          icon={mdiMagnify}
          aria-label={$t('search_for_existing_person')}
          onclick={() => {
            searchFaces = true;
          }}
        />
        {#if !isShowLoadingNewPerson}
          <IconButton
            color="secondary"
            variant="ghost"
            shape="round"
            icon={mdiPlus}
            aria-label={$t('create_new_person')}
            onclick={handleCreatePerson}
          />
        {:else}
          <div class="flex place-content-center place-items-center">
            <LoadingSpinner />
          </div>
        {/if}
      </div>
    {:else}
      <IconButton
        color="secondary"
        variant="ghost"
        shape="round"
        icon={mdiArrowLeftThin}
        aria-label={$t('back')}
        onclick={onClose}
      />
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
      <IconButton
        color="secondary"
        variant="ghost"
        shape="round"
        icon={mdiClose}
        aria-label={$t('cancel_search')}
        onclick={() => (searchFaces = false)}
      />
    {/if}
  </div>
  <div class="px-4 py-4 text-sm">
    <h2 class="mb-8 mt-4">{$t('all_people')}</h2>
    {#if isShowLoadingPeople}
      <div class="flex w-full justify-center">
        <LoadingSpinner />
      </div>
    {:else}
      <div class="mt-4 flex flex-wrap gap-2">
        {#each showPeople as person (person.id)}
          {#if !editedFace.person || person.id !== editedFace.person.id}
            <div class="h-29 w-24">
              <button
                type="button"
                class="group w-22.5 outline-none"
                onclick={() => onReassign(person)}
                onpointerover={() => (hoveredPersonId = person.id)}
                onpointerleave={() => (hoveredPersonId = null)}
              >
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
                    highlighted={hoveredPersonId === person.id}
                    class={focusHighlightClass}
                  />
                </div>

                <p
                  class="mt-1 truncate font-medium"
                  title={$getPersonNameWithHiddenValue(person.name, person.isHidden)}
                >
                  {person.name}
                </p>
              </button>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</section>
