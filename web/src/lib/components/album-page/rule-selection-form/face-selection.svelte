<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { PersonResponseDto, api } from '@api';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import FaceThumbnail from '$lib/components/assets/thumbnail/face-thumbnail.svelte';

  export let selectedIds: string[] = [];
  let people: PersonResponseDto[] = [];
  let newPeople: PersonResponseDto[] = [];

  const dispatch = createEventDispatcher<{ close: void; confirm: PersonResponseDto[] }>();

  onMount(async () => {
    const { data } = await api.personApi.getAllPeople({ withHidden: false });
    people = data.people.filter(({ id }) => !selectedIds.includes(id));
  });

  const handleSelection = (e: CustomEvent<{ person: PersonResponseDto }>) => {
    const person = e.detail.person;

    if (newPeople.some((p) => p.id === person.id)) {
      newPeople = newPeople.filter((p) => p.id !== person.id);
    } else {
      newPeople = [...newPeople, person];
    }
  };
</script>

<ControlAppBar showBackButton backIcon={ArrowLeft} on:close-button-click={() => dispatch('close')}>
  <svelte:fragment slot="leading">
    <p class="font-medium text-immich-fg dark:text-immich-dark-fg">
      {#if newPeople.length === 0}
        Select faces
      {:else if newPeople.length === 1}
        1 person selected
      {:else}
        {newPeople.length} people selected
      {/if}
    </p>
  </svelte:fragment>

  <svelte:fragment slot="trailing">
    <Button disabled={newPeople.length === 0} size="sm" title="Confirm" on:click={() => dispatch('confirm', newPeople)}
      >Confirm</Button
    >
  </svelte:fragment>
</ControlAppBar>

<div class="mt-24 flex flex-wrap gap-2 px-8">
  {#each people as person (person.id)}
    <FaceThumbnail
      {person}
      thumbnailSize={180}
      on:select={handleSelection}
      on:click={handleSelection}
      selected={newPeople.some((p) => p.id === person.id)}
    />
  {/each}
</div>
