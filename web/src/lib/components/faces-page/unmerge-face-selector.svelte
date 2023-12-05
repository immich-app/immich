<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import FaceThumbnail from './face-thumbnail.svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { api, AssetFaceUpdateItem, type PersonResponseDto } from '@api';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { mdiPlus, mdiMerge } from '@mdi/js';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import PeopleList from './people-list.svelte';
  import Icon from '$lib/components/elements/icon.svelte';

  export let assetIds: string[];
  export let personAssets: PersonResponseDto;

  let people: PersonResponseDto[] = [];
  let selectedPerson: PersonResponseDto | null = null;
  let disableButtons = false;
  let showLoadingSpinnerCreate = false;
  let showLoadingSpinnerReassign = false;
  let hasSelection = false;
  let screenHeight: number;

  $: unselectedPeople = selectedPerson
    ? people.filter((person) => selectedPerson && person.id !== selectedPerson.id && personAssets.id !== person.id)
    : people;

  let dispatch = createEventDispatcher();

  const selectedPeople: AssetFaceUpdateItem[] = [];

  for (const assetId of assetIds) {
    selectedPeople.push({ assetId, personId: personAssets.id });
  }

  onMount(async () => {
    const { data } = await api.personApi.getAllPeople({ withHidden: false });
    people = data.people;
  });

  const onClose = () => {
    dispatch('close');
  };

  const handleSelectedPerson = (person: PersonResponseDto) => {
    if (selectedPerson && selectedPerson.id === person.id) {
      handleRemoveSelectedPerson();
      return;
    }
    selectedPerson = person;
    hasSelection = true;
  };

  const handleRemoveSelectedPerson = () => {
    selectedPerson = null;
    hasSelection = false;
  };

  const handleCreate = async () => {
    const timeout = setTimeout(() => (showLoadingSpinnerCreate = true), 100);

    try {
      disableButtons = true;
      const { data } = await api.personApi.createPerson();
      await api.personApi.reassignFaces({
        id: data.id,
        assetFaceUpdateDto: { data: selectedPeople },
      });

      notificationController.show({
        message: `Re-assigned ${assetIds.length} asset${assetIds.length > 1 ? 's' : ''} to a new person`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to reassign assets to a new person');
    } finally {
      clearTimeout(timeout);
    }

    showLoadingSpinnerCreate = false;
    dispatch('confirm');
  };

  const handleReassign = async () => {
    const timeout = setTimeout(() => (showLoadingSpinnerReassign = true), 100);
    try {
      disableButtons = true;
      if (selectedPerson) {
        await api.personApi.reassignFaces({
          id: selectedPerson.id,
          assetFaceUpdateDto: { data: selectedPeople },
        });
        notificationController.show({
          message: `Re-assigned ${assetIds.length} asset${assetIds.length > 1 ? 's' : ''} to ${
            selectedPerson.name || 'an existing person'
          }`,
          type: NotificationType.Info,
        });
      }
    } catch (error) {
      handleError(error, `Unable to reassign assets to ${selectedPerson?.name || 'an existing person'}`);
    } finally {
      clearTimeout(timeout);
    }

    showLoadingSpinnerReassign = false;
    dispatch('confirm');
  };
</script>

<svelte:window bind:innerHeight={screenHeight} />

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
>
  <ControlAppBar on:close-button-click={onClose}>
    <svelte:fragment slot="leading">
      <slot name="header" />
      <div />
    </svelte:fragment>
    <svelte:fragment slot="trailing">
      <div class="flex gap-4">
        <Button
          title={'Assign selected assets to a new person'}
          size={'sm'}
          disabled={disableButtons || hasSelection}
          on:click={() => {
            handleCreate();
          }}
        >
          {#if !showLoadingSpinnerCreate}
            <Icon path={mdiPlus} size={18} />
          {:else}
            <LoadingSpinner />
          {/if}
          <span class="ml-2"> Create new Person</span></Button
        >
        <Button
          size={'sm'}
          title={'Assign selected assets to an existing person'}
          disabled={disableButtons || !hasSelection}
          on:click={() => {
            handleReassign();
          }}
        >
          {#if !showLoadingSpinnerReassign}
            <div>
              <Icon path={mdiMerge} size={18} class="rotate-180" />
            </div>
          {:else}
            <LoadingSpinner />
          {/if}
          <span class="ml-2"> Reassign</span></Button
        >
      </div>
    </svelte:fragment>
  </ControlAppBar>
  <slot name="merge" />
  <section class="bg-immich-bg px-[70px] pt-[100px] dark:bg-immich-dark-bg">
    <section id="merge-face-selector relative">
      {#if selectedPerson !== null}
        <div class="mb-10 h-[200px] place-content-center place-items-center">
          <p class="mb-4 text-center uppercase dark:text-white">Choose matching faces to re assign</p>

          <div class="grid grid-flow-col-dense place-content-center place-items-center gap-4">
            <FaceThumbnail
              person={selectedPerson}
              border
              circle
              selectable
              thumbnailSize={180}
              on:click={handleRemoveSelectedPerson}
            />
          </div>
        </div>
      {/if}
      <PeopleList
        people={unselectedPeople}
        peopleCopy={unselectedPeople}
        unselectedPeople={selectedPerson ? [selectedPerson, personAssets] : [personAssets]}
        {screenHeight}
        on:select={({ detail }) => handleSelectedPerson(detail)}
      />
    </section>
  </section>
</section>
