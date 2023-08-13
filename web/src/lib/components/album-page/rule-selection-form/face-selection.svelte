<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { PeopleResponseDto, PersonResponseDto, api } from '@api';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import PeopleCard from '$lib/components/faces-page/people-card.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';

  let people: PersonResponseDto[] = [];

  const dispatch = createEventDispatcher<{ close: void }>();
  onMount(async () => {
    const { data } = await api.personApi.getAllPeople({ withHidden: false });

    people = data.people;
  });
</script>

<div class="">
  <ControlAppBar showBackButton backIcon={ArrowLeft} on:close-button-click={() => dispatch('close')}>
    <svelte:fragment slot="leading">
      <p class="text-immich-fg dark:text-immich-dark-fg font-medium">Select a face</p>
    </svelte:fragment>
  </ControlAppBar>

  <div class="mt-24 flex flex-wrap gap-2 px-8">
    {#each people as person}
      <PeopleCard {person} selectionMode disableContextMenu />
    {/each}
  </div>
</div>
