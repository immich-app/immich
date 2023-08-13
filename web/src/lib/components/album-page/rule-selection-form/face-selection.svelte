<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { PersonResponseDto, api } from '@api';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import FaceThumbnail from '$lib/components/assets/thumbnail/face-thumbnail.svelte';

  export let selectedPeopleIds: Set<string> = new Set();
  let people: PersonResponseDto[] = [];
  let selectedPeople: PersonResponseDto[] = [];

  const dispatch = createEventDispatcher<{ close: void; confirm: { people: PersonResponseDto[] } }>();

  onMount(async () => {
    const { data } = await api.personApi.getAllPeople({ withHidden: false });

    people = data.people.filter((p) => !selectedPeopleIds.has(p.id));
  });

  const handleSelection = (e: CustomEvent<{ person: PersonResponseDto }>) => {
    const person = e.detail.person;

    if (selectedPeople.some((p) => p.id === person.id)) {
      selectedPeople = selectedPeople.filter((p) => p.id !== person.id);
    } else {
      selectedPeople = [...selectedPeople, person];
    }
  };

  const onConfirmClicked = () => {
    dispatch('confirm', { people: selectedPeople });
  };
</script>

<ControlAppBar showBackButton backIcon={ArrowLeft} on:close-button-click={() => dispatch('close')}>
  <svelte:fragment slot="leading">
    <p class="text-immich-fg dark:text-immich-dark-fg font-medium">
      {#if selectedPeople.length === 0}
        Select faces
      {:else}
        {selectedPeople.length} people selected
      {/if}
    </p>
  </svelte:fragment>

  <svelte:fragment slot="trailing">
    <Button disabled={selectedPeople.length === 0} size="sm" title="Confirm" on:click={onConfirmClicked}>Confirm</Button
    >
  </svelte:fragment>
</ControlAppBar>

<div class="mt-24 flex flex-wrap gap-2 px-8">
  {#each people as person}
    <FaceThumbnail
      {person}
      thumbnailSize={180}
      on:select={handleSelection}
      on:click={handleSelection}
      selected={selectedPeople.some((p) => p.id === person.id)}
    />
  {/each}
</div>
