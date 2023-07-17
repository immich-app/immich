<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { PersonResponseDto, api } from '@api';
  import AccountOff from 'svelte-material-icons/AccountOff.svelte';
  import type { PageData } from './$types';
  import { handleError } from '$lib/utils/handle-error';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';

  export let data: PageData;
  let selectHidden = false;
  let changeCounter = 0;
  let initialHiddenValues: Record<string, boolean> = {};

  data.people.people.forEach((person: PersonResponseDto) => {
    initialHiddenValues[person.id] = person.isHidden;
  });

  // Get number of person and visible people
  let countTotalPeople = data.people.total;
  let countVisiblePeople = data.people.visible;

  const handleDoneClick = async () => {
    try {
      // Reset the counter before checking changes
      let changeCounter = 0;

      // Check if the visibility for each person has been changed
      for (const person of data.people.people) {
        const index = person.id;
        const initialHiddenValue = initialHiddenValues[index];

        if (person.isHidden !== initialHiddenValue) {
          changeCounter++;
          await api.personApi.updatePerson({
            id: person.id,
            personUpdateDto: { isHidden: person.isHidden },
          });

          // Update the initial hidden values
          initialHiddenValues[index] = person.isHidden;

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
</script>

<UserPageLayout
  user={data.user}
  showUploadButton
  bind:countTotalPeople
  bind:selectHidden
  on:doneClick={handleDoneClick}
  title="People"
>
  {#if countVisiblePeople > 0 || selectHidden}
    {#if !selectHidden}
      <div class="pl-4">
        <div class="flex flex-row flex-wrap gap-1">
          {#each data.people.people as person (person.id)}
            {#if !person.isHidden}
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
          {#each data.people.people as person (person.id)}
            <div class="relative">
              <div class="filter brightness-95 rounded-xl w-48 h-48">
                <button class="h-full w-full" on:click={() => (person.isHidden = !person.isHidden)}>
                  <ImageThumbnail
                    hidden={person.isHidden}
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
