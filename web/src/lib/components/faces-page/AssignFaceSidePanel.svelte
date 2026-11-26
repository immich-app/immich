<script lang="ts">
  import SearchPeople from '#lib/components/faces-page/PeopleSearch.svelte';
  import { timeBeforeShowLoadingSpinner } from '#lib/constants.ts';
  import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
  import { queryClient } from '#lib/queries/client.ts';
  import { getAllPeopleQuery } from '#lib/queries/person.query.ts';
  import { getPeopleThumbnailUrl } from '#lib/utils.ts';
  import { zoomImageToBase64 } from '#lib/utils/people-utils.ts';
  import { getPersonNameWithHiddenValue } from '#lib/utils/person.ts';
  import { AssetTypeEnum, type AssetFaceResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { IconButton, LoadingSpinner } from '@immich/ui';
  import { mdiArrowLeftThin, mdiClose, mdiMagnify, mdiPlus } from '@mdi/js';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';
  import { linear } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ImageThumbnail from '../assets/thumbnail/ImageThumbnail.svelte';

  interface Props {
    editedFace: AssetFaceResponseDto;
    assetId: string;
    assetType: AssetTypeEnum;
    onClose: () => void;
    onCreatePerson: (featurePhoto: string | null) => void;
    onReassign: (person: PersonResponseDto) => void;
  }

  let { editedFace, assetId, assetType, onClose, onCreatePerson, onReassign }: Props = $props();

  const query = createQuery(
    () => ({ ...getAllPeopleQuery({ withHidden: true, closestAssetId: editedFace.id }), staleTime: 0 }),
    () => queryClient,
  );
  const allPeople = $derived(query.data?.people ?? []);

  // loading spinners
  let isShowLoadingNewPerson = $state(false);
  let isShowLoadingSearch = $state(false);

  // search people
  let searchedPeople: PersonResponseDto[] = $state([]);
  let searchFaces = $state(false);
  let searchName = $state('');

  let showPeople = $derived(searchName ? searchedPeople : allPeople.filter((person) => !person.isHidden));

  const handleCreatePerson = async () => {
    const timeout = setTimeout(() => (isShowLoadingNewPerson = true), timeBeforeShowLoadingSpinner);

    const newFeaturePhoto = await zoomImageToBase64(editedFace, assetId, assetType, assetViewerManager.imgRef);

    onCreatePerson(newFeaturePhoto);

    clearTimeout(timeout);
    isShowLoadingNewPerson = false;
    onCreatePerson(newFeaturePhoto);
  };
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 h-full w-90 overflow-x-hidden bg-light p-2 dark:text-immich-dark-fg"
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
      <div class="flex w-full">
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
  <div class="p-4 text-sm">
    <h2 class="mt-4 mb-8">{$t('all_people')}</h2>
    {#if query.isPending}
      <div class="flex w-full justify-center">
        <LoadingSpinner />
      </div>
    {:else}
      <div class="mt-4 flex immich-scrollbar flex-wrap gap-2 overflow-y-auto">
        {#each showPeople as person (person.id)}
          {#if !editedFace.person || person.id !== editedFace.person.id}
            <div class="w-fit">
              <button type="button" class="w-22.5" onclick={() => onReassign(person)}>
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
