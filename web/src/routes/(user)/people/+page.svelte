<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AccountOff from 'svelte-material-icons/AccountOff.svelte';
  import type { PageData } from './$types';
  import PeopleCard from '$lib/components/faces-page/people-card.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { api, type PersonResponseDto } from '@api';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import ShowHide from '$lib/components/faces-page/show-hide.svelte';
  import IconButton from '$lib/components/elements/buttons/icon-button.svelte';
  import EyeOutline from 'svelte-material-icons/EyeOutline.svelte';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';

  export let data: PageData;
  let selectHidden = false;
  let changeCounter = 0;
  let initialHiddenValues: Record<string, boolean> = {};

  let people = data.people.people;
  let countTotalPeople = data.people.total;
  let countVisiblePeople = data.people.visible;

  people.forEach((person: PersonResponseDto) => {
    initialHiddenValues[person.id] = person.isHidden;
  });

  const handleCloseClick = () => {
    selectHidden = false;
    people.forEach((person: PersonResponseDto) => {
      person.isHidden = initialHiddenValues[person.id];
    });
  };

  const handleDoneClick = async () => {
    selectHidden = false;
    try {
      // Reset the counter before checking changes
      let changeCounter = 0;

      // Check if the visibility for each person has been changed
      for (const person of people) {
        if (person.isHidden !== initialHiddenValues[person.id]) {
          changeCounter++;
          await api.personApi.updatePerson({
            id: person.id,
            personUpdateDto: { isHidden: person.isHidden },
          });

          // Update the initial hidden values
          initialHiddenValues[person.id] = person.isHidden;

          // Update the count of hidden/visible people
          countVisiblePeople += person.isHidden ? -1 : 1;
        }
      }

      if (changeCounter > 0) {
        notificationController.show({
          type: NotificationType.Info,
          message: `Visibility changed for ${changeCounter} ${changeCounter <= 1 ? 'person' : 'people'}`,
        });
      }
    } catch (error) {
      handleError(
        error,
        `Unable to change the visibility for ${changeCounter} ${changeCounter <= 1 ? 'person' : 'people'}`,
      );
    }
  };

  let showChangeNameModal = false;
  let personName = '';
  let edittingPerson: PersonResponseDto | null = null;

  const handleChangeName = ({ detail }: CustomEvent<PersonResponseDto>) => {
    showChangeNameModal = true;
    personName = detail.name;
    edittingPerson = detail;
  };

  const handleMergeFaces = (event: CustomEvent<PersonResponseDto>) => {
    goto(`${AppRoute.PEOPLE}/${event.detail.id}?action=merge`);
  };

  const submitNameChange = async () => {
    try {
      if (edittingPerson) {
        const { data: updatedPerson } = await api.personApi.updatePerson({
          id: edittingPerson.id,
          personUpdateDto: { name: personName },
        });

        people = people.map((person: PersonResponseDto) => {
          if (person.id === updatedPerson.id) {
            return updatedPerson;
          }
          return person;
        });

        showChangeNameModal = false;

        notificationController.show({
          message: 'Change name succesfully',
          type: NotificationType.Info,
        });
      }
    } catch (error) {
      handleError(error, 'Unable to save name');
    }
  };
</script>

<UserPageLayout user={data.user} title="People">
  <svelte:fragment slot="buttons">
    {#if countTotalPeople > 0}
      <IconButton on:click={() => (selectHidden = !selectHidden)}>
        <div class="flex flex-wrap place-items-center justify-center gap-x-1 text-sm">
          <EyeOutline size="18" />
          <p class="ml-2">Show & hide faces</p>
        </div>
      </IconButton>
    {/if}
  </svelte:fragment>

  {#if countVisiblePeople > 0}
    <div class="pl-4">
      <div class="flex flex-row flex-wrap gap-1">
        {#key selectHidden}
          {#each people as person (person.id)}
            {#if !person.isHidden}
              <PeopleCard {person} on:change-name={handleChangeName} on:merge-faces={handleMergeFaces} />
            {/if}
          {/each}
        {/key}
      </div>
    </div>
  {:else}
    <div class="flex min-h-[calc(66vh_-_11rem)] w-full place-content-center items-center dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <AccountOff size="3.5em" />
        <p class="mt-5 text-3xl font-medium">No people</p>
      </div>
    </div>
  {/if}

  {#if showChangeNameModal}
    <FullScreenModal on:clickOutside={() => (showChangeNameModal = false)}>
      <div
        class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
      >
        <div
          class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
        >
          <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Change name</h1>
        </div>

        <form on:submit|preventDefault={submitNameChange} autocomplete="off">
          <div class="m-4 flex flex-col gap-2">
            <label class="immich-form-label" for="email">Name</label>
            <!-- svelte-ignore a11y-autofocus -->
            <input class="immich-form-input" id="name" name="name" type="text" bind:value={personName} autofocus />
          </div>

          <div class="mt-8 flex w-full gap-4 px-4">
            <Button
              color="gray"
              fullwidth
              on:click={() => {
                showChangeNameModal = false;
              }}>Cancel</Button
            >
            <Button type="submit" fullwidth>Ok</Button>
          </div>
        </form>
      </div>
    </FullScreenModal>
  {/if}
</UserPageLayout>
{#if selectHidden}
  <ShowHide on:doneClick={handleDoneClick} on:closeClick={handleCloseClick}>
    <div class="pl-4">
      <div class="flex flex-row flex-wrap gap-1">
        {#each people as person (person.id)}
          <div class="relative">
            <div class="h-48 w-48 rounded-xl brightness-95 filter">
              <button class="h-full w-full" on:click={() => (person.isHidden = !person.isHidden)}>
                <ImageThumbnail
                  bind:hidden={person.isHidden}
                  shadow
                  url={api.getPeopleThumbnailUrl(person.id)}
                  altText={person.name}
                  widthStyle="100%"
                />
              </button>
            </div>
            {#if person.name}
              <span
                class="w-100 absolute bottom-2 w-full text-ellipsis px-1 text-center font-medium text-white backdrop-blur-[1px] hover:cursor-pointer"
              >
                {person.name}
              </span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </ShowHide>
{/if}
