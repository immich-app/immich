<script lang="ts">
  import { onMount } from 'svelte';
  import type { PersonResponseDto } from '../../../api/open-api';
  import { api } from '../../../api/api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';

  export let person: PersonResponseDto;
  let people: PersonResponseDto[] = [];

  onMount(async () => {
    const { data } = await api.personApi.getAllPeople();
    people = data;
  });
</script>

<section id="merge-face-selector">
  <div>Lets merge some faces</div>

  <div class="pl-4">
    <div class="flex flex-row flex-wrap gap-1">
      {#each people as person (person.id)}
        <div class="relative">
          <div class="filter brightness-100 rounded-xl w-24">
            <ImageThumbnail url={api.getPeopleThumbnailUrl(person.id)} altText={person.name} widthStyle="100%" />
          </div>
          {#if person.name}
            <span
              class="absolute bottom-2 w-full text-center font-medium text-white text-ellipsis w-100 px-1 hover:cursor-pointer backdrop-blur-[1px]"
            >
              {person.name}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
