<script lang="ts">
  import { type PersonResponseDto } from '@immich/sdk';
  import { createEventDispatcher, onMount } from 'svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import Button from '../elements/buttons/button.svelte';

  export let person: PersonResponseDto;
  export let name: string;
  export let suggestedPeople = false;
  export let thumbnailData: string;

  let inputElement: HTMLInputElement;

  const dispatch = createEventDispatcher<{
    change: string;
    cancel: void;
    input: void;
  }>();

  onMount(() => {
    inputElement.focus();
  });
</script>

<div
  class="flex w-full h-14 place-items-center {suggestedPeople
    ? 'rounded-t-lg dark:border-immich-dark-gray'
    : 'rounded-lg'}  bg-gray-100 p-2 dark:bg-gray-700"
>
  <ImageThumbnail circle shadow url={thumbnailData} altText={person.name} widthStyle="2rem" heightStyle="2rem" />
  <form
    class="ml-4 flex w-full justify-between gap-16"
    autocomplete="off"
    on:submit|preventDefault={() => dispatch('change', name)}
  >
    <input
      class="w-full gap-2 bg-gray-100 dark:bg-gray-700 dark:text-white"
      type="text"
      placeholder="New name or nickname"
      bind:value={name}
      bind:this={inputElement}
      on:input={() => dispatch('input')}
    />
    <Button size="sm" type="submit">Done</Button>
  </form>
</div>
