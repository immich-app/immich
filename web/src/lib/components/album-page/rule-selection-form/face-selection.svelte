<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { PeopleResponseDto, PersonResponseDto, api } from '@api';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import PeopleCard from '$lib/components/faces-page/people-card.svelte';

  let people: PersonResponseDto[] = [];

  const dispatch = createEventDispatcher<{ close: void }>();
  onMount(async () => {
    const { data } = await api.personApi.getAllPeople({ withHidden: false });

    people = data.people;
  });
</script>

<div class="">
  <p>Select faces</p>
  <div>
    <button on:click={() => dispatch('close')}>CLOSE</button>
  </div>
  <div class="flex flex-wrap">
    {#each people as person}
      <PeopleCard {person} selectionMode disableContextMenu />
    {/each}
  </div>
</div>
