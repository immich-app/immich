<script lang="ts">
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { getPersonNameWithHiddenValue } from '$lib/utils/person';
  import { getPeopleThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { AssetTypeEnum, type AssetFaceResponseDto, type PersonResponseDto, getAllPeople } from '@immich/sdk';
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
  import { handleError } from '$lib/utils/handle-error';
  import { onMount } from 'svelte';

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

  let showPeople = $derived(searchName ? searchedPeople : allPeople.filter((person) => !person.isHidden));

  onMount(() => {
    handlePromiseError(loadPeople());
  });

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
        <CircleIconButton icon={mdiArrowLeftThin} title={$t('back')} onclick={onClose} />
        <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">{$t('select_face')}</p>
      </div>
      <div class="flex justify-end gap-2">
        <CircleIconButton
          icon={mdiMagnify}
          title={$t('search_for_existing_person')}
          onclick={() => {
            searchFaces = true;
          }}
        />
        {#if !isShowLoadingNewPerson}
          <CircleIconButton icon={mdiPlus} title={$t('create_new_person')} onclick={handleCreatePerson} />
        {:else}
          <div class="flex place-content-center place-items-center">
            <LoadingSpinner />
          </div>
        {/if}
      </div>
    {:else}
      <CircleIconButton icon={mdiArrowLeftThin} title={$t('back')} onclick={onClose} />
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
      <CircleIconButton icon={mdiClose} title={$t('cancel_search')} onclick={() => (searchFaces = false)} />
    {/if}
  </div>
  <div class="px-4 py-4 text-sm">
    <h2 class="mb-8 mt-4 uppercase">{$t('all_people')}</h2>
    {#if isShowLoadingPeople}
      <div class="flex w-full justify-center">
        <LoadingSpinner />
      </div>
    {:else}
      <div class="immich-scrollbar mt-4 flex flex-wrap gap-2 overflow-y-auto">
        {#each showPeople as person (person.id)}
          {#if !editedFace.person || person.id !== editedFace.person.id}
            <div class="w-fit">
              <button type="button" class="w-[90px]" onclick={() => onReassign(person)}>
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
