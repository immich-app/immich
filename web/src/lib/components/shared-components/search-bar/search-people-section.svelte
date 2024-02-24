<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import type { PersonResponseDto } from '@immich/sdk';
  import { mdiClose, mdiArrowRight } from '@mdi/js';
  import type { SearchFilter } from './search-filter-box.svelte';

  export let width: number;
  export let filteredPeople: SearchFilter['people'];
  export let suggestedPeople: PersonResponseDto[];

  let showAllPeople = false;
  $: numberOfPeople = (width - 80) / 85;
  $: peopleList = showAllPeople ? suggestedPeople : suggestedPeople.slice(0, numberOfPeople);

  const handlePersonSelect = (id: string) => {
    if (filteredPeople.some((p) => p.id === id)) {
      filteredPeople = filteredPeople.filter((p) => p.id !== id);
      return;
    }

    const person = suggestedPeople.find((p) => p.id === id);
    if (person) {
      filteredPeople = [...filteredPeople, person];
    }
  };
</script>

{#if suggestedPeople.length > 0}
  <div id="people-selection" class="-mb-4">
    <div class="flex items-center gap-6">
      <p class="immich-form-label">PEOPLE</p>
    </div>

    <div class="flex -mx-1 max-h-64 gap-1 mt-2 flex-wrap overflow-y-auto immich-scrollbar">
      {#each peopleList as person (person.id)}
        <button
          type="button"
          class="w-20 text-center rounded-3xl border-2 border-transparent hover:bg-immich-gray dark:hover:bg-immich-dark-primary/20 p-2 transition-all {filteredPeople.some(
            (p) => p.id === person.id,
          )
            ? 'dark:border-slate-500 border-slate-400 bg-slate-200 dark:bg-slate-800 dark:text-white'
            : ''}"
          on:click={() => handlePersonSelect(person.id)}
        >
          <ImageThumbnail
            circle
            shadow
            url={getPeopleThumbnailUrl(person.id)}
            altText={person.name}
            widthStyle="100%"
          />
          <p class="mt-2 line-clamp-2 text-sm font-medium dark:text-white">{person.name}</p>
        </button>
      {/each}
    </div>

    {#if showAllPeople || suggestedPeople.length > peopleList.length}
      <div class="flex justify-center mt-2">
        <Button
          shadow={false}
          color="text-primary"
          class="flex gap-2 place-items-center"
          on:click={() => (showAllPeople = !showAllPeople)}
        >
          {#if showAllPeople}
            <span><Icon path={mdiClose} /></span>
            Collapse
          {:else}
            <span><Icon path={mdiArrowRight} /></span>
            See all people
          {/if}
        </Button>
      </div>
    {/if}
  </div>
{/if}
