<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AccountOff from 'svelte-material-icons/AccountOff.svelte';
  import type { PageData } from './$types';
  import PeopleCard from '$lib/components/faces-page/people-card.svelte';
  export let data: PageData;
</script>

<UserPageLayout user={data.user} showUploadButton title="People">
  <section class="people-page">
    {#if data.people.length > 0}
      <div class="pl-4">
        <div class="flex flex-row flex-wrap gap-1">
          {#each data.people as person (person.id)}
            <PeopleCard {person} />
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
</UserPageLayout>
