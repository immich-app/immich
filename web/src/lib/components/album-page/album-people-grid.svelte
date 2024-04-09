<script lang="ts">
  import { type PersonResponseDto } from '@immich/sdk';
  import { onDestroy } from 'svelte';
  import AlbumFaceThumbnail from '$lib/components/album-page/album-face-thumbnail.svelte';
  import { writable } from 'svelte/store';

  export let people: PersonResponseDto[];
  export let selectedPeople = writable([] as Array<PersonResponseDto>);

  const handleFaceThumbnailClick = (person: PersonResponseDto, selected: boolean) => {
    if (!selected) {
      return selectedPeople.update((arr) => [...arr, person]);
    }
    selectedPeople.update((arr) => arr.filter((p) => p.id !== person.id));
  };

  onDestroy(() => {
    selectedPeople.update(() => []);
  });
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 xl:grid-cols-9 2xl:grid-cols-12 gap-2">
  {#each people as person, index (person.id)}
    <AlbumFaceThumbnail
      {person}
      onClick={handleFaceThumbnailClick}
      on:select={() => {}}
      on:mouse-event={() => {}}
      selected={$selectedPeople.some((p) => p.id === person.id)}
    />
  {/each}
</div>
