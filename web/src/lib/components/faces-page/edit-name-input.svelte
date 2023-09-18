<script lang="ts">
  import { PersonResponseDto, api } from '@api';
  import { createEventDispatcher } from 'svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import Button from '../elements/buttons/button.svelte';

  export let person: PersonResponseDto;
  export let name: string;
  export let suggestedPeople = false;

  const dispatch = createEventDispatcher<{
    change: string;
    cancel: void;
  }>();
</script>

<div
  class="flex w-full place-items-center {suggestedPeople
    ? 'rounded-t-lg border-b dark:border-immich-dark-gray'
    : 'rounded-lg'}  bg-gray-100 p-2 dark:bg-gray-700"
>
  <ImageThumbnail
    circle
    shadow
    url={api.getPeopleThumbnailUrl(person.id)}
    altText={person.name}
    widthStyle="2rem"
    heightStyle="2rem"
  />
  <form
    class="ml-4 flex w-full justify-between gap-16"
    autocomplete="off"
    on:submit|preventDefault={() => dispatch('change', name)}
  >
    <!-- svelte-ignore a11y-autofocus -->
    <input
      autofocus
      class="w-full gap-2 bg-gray-100 dark:bg-gray-700 dark:text-white"
      type="text"
      placeholder="New name or nickname"
      bind:value={name}
    />
    <Button size="sm" type="submit">Done</Button>
  </form>
</div>
