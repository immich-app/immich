<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout-people.svelte';
  import { api } from '@api';
  import AccountOff from 'svelte-material-icons/AccountOff.svelte';
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import { handleError } from '$lib/utils/handle-error';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';

  export let data: PageData;
  export let hidden = false;
  let changeCounter = 0;
  let initialHiddenValues: boolean[] = [];

  onMount(() => {
    // Save the initial number of "hidden" faces
    initialHiddenValues = data.people.map((person) => person.hidden);
  });

  const handleDoneClick = async () => {
    // Reset the counter before checking changes
    changeCounter = 0;

    data.people.forEach(async (person, index) => {
      if (person.hidden !== initialHiddenValues[index]) {
        changeCounter++;
        await api.personApi.updatePerson({
          id: person.id,
          personUpdateDto: { hidden: person.hidden },
        });

        // Update the initial hidden value for the person
        initialHiddenValues[index] = person.hidden;
      }
    });
    try {
      if (changeCounter > 0)
        notificationController.show({
          type: NotificationType.Info,
          message: `Visibility changed for ${changeCounter} person${changeCounter <= 1 ? '' : 's'}`,
        });
    } catch (error) {
      handleError(error, `Unable to change the visibility for remove asset from`);
    }
    changeCounter = 0;
  };
</script>

<UserPageLayout user={data.user} showUploadButton bind:hidden on:doneClick={handleDoneClick} title="People">
  {#if data.people.length > 0}
    {#if !hidden}
      <div class="pl-4">
        <div class="flex flex-row flex-wrap gap-1">
          {#each data.people as person (person.id)}
            {#if !person.hidden}
              <div class="relative">
                <a href="/people/{person.id}" draggable="false">
                  <div class="filter brightness-95 rounded-xl w-48">
                    <ImageThumbnail
                      shadow
                      url={api.getPeopleThumbnailUrl(person.id)}
                      altText={person.name}
                      widthStyle="100%"
                    />
                  </div>
                  {#if person.name}
                    <span
                      class="absolute bottom-2 w-full text-center font-medium text-white text-ellipsis w-100 px-1 hover:cursor-pointer backdrop-blur-[1px]"
                    >
                      {person.name}
                    </span>
                  {/if}
                </a>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {:else}
      <div class="pl-4">
        <div class="flex flex-row flex-wrap gap-1">
          {#each data.people as person (person.id)}
            <div class="relative">
              <div class="filter brightness-95 rounded-xl w-48 h-48">
                <button class="h-full w-full" on:click={() => (person.hidden = !person.hidden)}>
                  <ImageThumbnail
                    hidden={person.hidden}
                    shadow
                    url={api.getPeopleThumbnailUrl(person.id)}
                    altText={person.name}
                    widthStyle="100%"
                  />
                </button>
              </div>
              {#if person.name}
                <span
                  class="absolute bottom-2 w-full text-center font-medium text-white text-ellipsis w-100 px-1 hover:cursor-pointer backdrop-blur-[1px]"
                >
                  {person.name}
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <div class="flex items-center place-content-center w-full min-h-[calc(66vh_-_11rem)] dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <AccountOff size="3.5em" />
        <p class="font-medium text-3xl mt-5">No people</p>
      </div>
    </div>
  {/if}
</UserPageLayout>
