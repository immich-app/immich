<script lang="ts">
  import { api, type PersonResponseDto } from '@api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';

  export let person: PersonResponseDto;
  export let selectable = false;
  export let thumbnailSize = 160;
</script>

<div class="relative transition-all rounded-lg">
  <div class="rounded-xl filter brightness-80" style:width={thumbnailSize + 'px'}>
    <ImageThumbnail url={api.getPeopleThumbnailUrl(person.id)} altText={person.name} widthStyle="100%" curve />
  </div>

  <div
    class="absolute top-0 left-0 w-full h-full bg-immich-primary/30 opacity-0 rounded-lg"
    class:hover:opacity-100={selectable}
    class:hover:cursor-pointer={selectable}
  />

  {#if person.name}
    <span
      class="absolute bottom-2 w-full text-center font-medium text-white text-ellipsis w-100 px-1 hover:cursor-pointer backdrop-blur-[1px]"
    >
      {person.name}
    </span>
  {/if}
</div>
