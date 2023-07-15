<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { api } from '@api';
  import AccountOff from 'svelte-material-icons/AccountOff.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<UserPageLayout user={data.user} showUploadButton title="People">
  {#if data.people.length > 0}
    <div class="pl-4">
      <div class="flex flex-row flex-wrap gap-1">
        {#each data.people as person (person.id)}
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
</UserPageLayout>
