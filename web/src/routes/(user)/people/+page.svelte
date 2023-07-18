<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AccountOff from 'svelte-material-icons/AccountOff.svelte';
  import type { PageData } from './$types';
  import PeopleCard from '$lib/components/faces-page/people-card.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { api, type PersonResponseDto } from '@api';
  import { handleError } from '$lib/utils/handle-error';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  export let data: PageData;

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

        data.people = data.people.map((person: PersonResponseDto) => {
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

<UserPageLayout user={data.user} showUploadButton title="People">
  <section>
    {#if data.people.length > 0}
      <div class="pl-4">
        <div class="flex flex-row flex-wrap gap-1">
          {#each data.people as person (person.id)}
            <PeopleCard {person} on:change-name={handleChangeName} on:merge-faces={handleMergeFaces} />
          {/each}
        </div>
      </div>
    {:else}
      <div class="flex items-center place-content-center w-full min-h-[calc(66vh_-_11rem)] dark:text-white">
        <div class="flex flex-col content-center items-center text-center">
          <AccountOff size="3.5em" />
          <p class="font-medium text-3xl mt-5">No people</p>
        </div>
      </div>
    {/if}
  </section>

  {#if showChangeNameModal}
    <FullScreenModal on:clickOutside={() => (showChangeNameModal = false)}>
      <div
        class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
      >
        <div
          class="flex flex-col place-items-center place-content-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
        >
          <h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">Change name</h1>
        </div>

        <form on:submit|preventDefault={submitNameChange} autocomplete="off">
          <div class="m-4 flex flex-col gap-2">
            <label class="immich-form-label" for="email">Name</label>
            <!-- svelte-ignore a11y-autofocus -->
            <input class="immich-form-input" id="name" name="name" type="text" bind:value={personName} autofocus />
          </div>

          <div class="flex w-full px-4 gap-4 mt-8">
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
