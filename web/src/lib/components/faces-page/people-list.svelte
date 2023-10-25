<script lang="ts">
  import type { PersonResponseDto } from '@api';
  import FaceThumbnail from './face-thumbnail.svelte';
  import { createEventDispatcher } from 'svelte';

  export let screenHeight: number;
  export let people: PersonResponseDto[] = [];

  let dispatch = createEventDispatcher<{
    select: PersonResponseDto;
  }>();
</script>

<div
  class="immich-scrollbar overflow-y-auto rounded-3xl bg-gray-200 p-10 dark:bg-immich-dark-gray"
  style:max-height={screenHeight - 400 + 'px'}
>
  <div class="grid-col-2 grid gap-8 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
    {#each people as person (person.id)}
      <FaceThumbnail
        {person}
        on:click={() => {
          dispatch('select', person);
        }}
        circle
        border
        selectable
      />
    {/each}
  </div>
</div>
