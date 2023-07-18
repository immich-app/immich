<script lang="ts">
  import { PersonResponseDto, api } from '@api';
  import { createEventDispatcher } from 'svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import Button from '../elements/buttons/button.svelte';
  import { clickOutside } from '$lib/utils/click-outside';

  export let person: PersonResponseDto;
  let name = person.name;

  const dispatch = createEventDispatcher<{
    change: string;
    cancel: void;
  }>();
</script>

<div
  class="flex max-w-lg place-items-center rounded-lg border bg-gray-100 p-2 dark:border-transparent dark:bg-gray-700"
  use:clickOutside
  on:outclick={() => dispatch('cancel')}
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
