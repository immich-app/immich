<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { api, type PersonResponseDto } from '@api';
  import FaceThumbnail from './face-thumbnail.svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { flip } from 'svelte/animate';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { mdiCallMerge, mdiClose, mdiMagnify, mdiMerge, mdiSwapHorizontal } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { cloneDeep } from 'lodash-es';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { searchNameLocal } from '$lib/utils/person';
  import { page } from '$app/stores';

  export let person: PersonResponseDto;
  let people: PersonResponseDto[] = [];
  let peopleCopy: PersonResponseDto[] = [];
  let selectedPeople: PersonResponseDto[] = [];
  let screenHeight: number;
  let isShowConfirmation = false;
  let name = '';
  let searchWord: string;
  let isSearchingPeople = false;
  let dispatch = createEventDispatcher();

  $: hasSelection = selectedPeople.length > 0;
  $: unselectedPeople = people.filter(
    (source) => !selectedPeople.some((selected) => selected.id === source.id) && source.id !== person.id,
  );

  onMount(async () => {
    const { data } = await api.personApi.getAllPeople({ withHidden: false });
    people = data.people;
    peopleCopy = cloneDeep(people);
  });

  const onClose = () => {
    dispatch('go-back');
  };

  const resetSearch = () => {
    name = '';
    people = peopleCopy;
  };

  const searchPeople = async (force: boolean) => {
    if (name === '') {
      people = peopleCopy;
      return;
    }
    if (!force) {
      if (people.length < 20 && name.startsWith(searchWord)) {
        people = searchNameLocal(name, peopleCopy, 10);
        return;
      }
    }

    const timeout = setTimeout(() => (isSearchingPeople = true), 100);
    try {
      const { data } = await api.searchApi.searchPerson({ name });
      people = data;
      searchWord = name;
    } catch (error) {
      handleError(error, "Can't search people");
    } finally {
      clearTimeout(timeout);
    }

    isSearchingPeople = false;
  };

  const handleSwapPeople = () => {
    [person, selectedPeople[0]] = [selectedPeople[0], person];
    $page.url.searchParams.set('action', 'merge');
    goto(`${AppRoute.PEOPLE}/${person.id}?${$page.url.searchParams.toString()}`);
  };

  const onSelect = (selected: PersonResponseDto) => {
    if (selectedPeople.includes(selected)) {
      selectedPeople = selectedPeople.filter((person) => person.id !== selected.id);
      return;
    }

    if (selectedPeople.length >= 5) {
      notificationController.show({
        message: 'You can only merge up to 5 faces at a time',
        type: NotificationType.Info,
      });
      return;
    }

    selectedPeople = [selected, ...selectedPeople];
  };

  const handleMerge = async () => {
    try {
      const { data: results } = await api.personApi.mergePerson({
        id: person.id,
        mergePersonDto: { ids: selectedPeople.map(({ id }) => id) },
      });
      const count = results.filter(({ success }) => success).length;
      notificationController.show({
        message: `Merged ${count} ${count === 1 ? 'person' : 'people'}`,
        type: NotificationType.Info,
      });
      dispatch('merge');
    } catch (error) {
      handleError(error, 'Cannot merge faces');
    } finally {
      isShowConfirmation = false;
    }
  };
</script>

<svelte:window bind:innerHeight={screenHeight} />

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
>
  <ControlAppBar on:close-button-click={onClose}>
    <svelte:fragment slot="leading">
      {#if hasSelection}
        Selected {selectedPeople.length}
      {:else}
        Merge faces
      {/if}
      <div />
    </svelte:fragment>
    <svelte:fragment slot="trailing">
      <Button
        size={'sm'}
        disabled={!hasSelection}
        on:click={() => {
          isShowConfirmation = true;
        }}
      >
        <Icon path={mdiMerge} size={18} />
        <span class="ml-2"> Merge</span></Button
      >
    </svelte:fragment>
  </ControlAppBar>
  <section class="bg-immich-bg px-[70px] pt-[100px] dark:bg-immich-dark-bg">
    <section id="merge-face-selector relative">
      <div class="mb-10 h-[200px] place-content-center place-items-center">
        <p class="mb-4 text-center uppercase dark:text-white">Choose matching faces to merge</p>

        <div class="grid grid-flow-col-dense place-content-center place-items-center gap-4">
          {#each selectedPeople as person (person.id)}
            <div animate:flip={{ duration: 250, easing: quintOut }}>
              <FaceThumbnail border circle {person} selectable thumbnailSize={120} on:click={() => onSelect(person)} />
            </div>
          {/each}

          {#if hasSelection}
            <div class="relative h-full">
              <div class="flex flex-col h-full justify-between">
                <div class="flex h-full items-center justify-center">
                  <Icon path={mdiCallMerge} size={48} class="rotate-90 dark:text-white" />
                </div>
                {#if selectedPeople.length === 1}
                  <div class="absolute bottom-2">
                    <CircleIconButton icon={mdiSwapHorizontal} size="24" on:click={handleSwapPeople} />
                  </div>
                {/if}
              </div>
            </div>
          {/if}
          <FaceThumbnail {person} border circle selectable={false} thumbnailSize={180} />
        </div>
      </div>

      <div
        class="flex w-40 sm:w-48 md:w-96 h-14 rounded-lg bg-gray-100 p-2 dark:bg-gray-700 mb-8 gap-2 place-items-center"
      >
        <button on:click={() => searchPeople(true)}>
          <div class="w-fit">
            <Icon path={mdiMagnify} size="24" />
          </div>
        </button>
        <!-- svelte-ignore a11y-autofocus -->
        <input
          autofocus
          class="w-full gap-2 bg-gray-100 dark:bg-gray-700 dark:text-white"
          type="text"
          placeholder="Search names"
          bind:value={name}
          on:input={() => searchPeople(false)}
        />
        {#if name}
          <button on:click={resetSearch}>
            <Icon path={mdiClose} />
          </button>
        {/if}
        {#if isSearchingPeople}
          <div class="flex place-items-center">
            <LoadingSpinner />
          </div>
        {/if}
      </div>

      <div
        class="immich-scrollbar overflow-y-auto rounded-3xl bg-gray-200 pt-8 px-8 pb-10 dark:bg-immich-dark-gray"
        style:max-height={screenHeight - 250 - 250 + 'px'}
      >
        <div class="grid-col-2 grid gap-8 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
          {#each unselectedPeople as person (person.id)}
            <FaceThumbnail {person} on:click={() => onSelect(person)} circle border selectable />
          {/each}
        </div>
      </div>
    </section>

    {#if isShowConfirmation}
      <ConfirmDialogue
        title="Merge faces"
        confirmText="Merge"
        on:confirm={handleMerge}
        on:cancel={() => (isShowConfirmation = false)}
      >
        <svelte:fragment slot="prompt">
          <p>Are you sure you want merge these faces? <br />This action is <strong>irreversible</strong>.</p>
        </svelte:fragment>
      </ConfirmDialogue>
    {/if}
  </section>
</section>
