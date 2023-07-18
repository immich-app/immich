<script lang="ts">
  import { PersonResponseDto, api } from '@api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';

  export let person: PersonResponseDto;
</script>

<div id="people-card" class="relative">
  <a href="/people/{person.id}" draggable="false">
    <div class="filter brightness-95 rounded-xl w-48">
      <ImageThumbnail shadow url={api.getPeopleThumbnailUrl(person.id)} altText={person.name} widthStyle="100%" />
    </div>
    {#if person.name}
      <span
        class="absolute bottom-2 w-full text-center font-medium text-white text-ellipsis w-100 px-1 hover:cursor-pointer backdrop-blur-[1px]"
      >
        {person.name}
      </span>
    {/if}
  </a>

  <button
    class="absolute top-2 right-2 z-10"
    on:click|stopPropagation|preventDefault={() => {}}
    data-testid="context-button-parent"
  >
    <IconButton color="transparent-gray">
      <DotsVertical size="20" />
    </IconButton>
  </button>
</div>
