<script lang="ts">
  import BaseModal from '$lib/components/shared-components/base-modal.svelte';
  import { createEventDispatcher } from 'svelte';
  import { RuleKey, type AlbumResponseDto, type PersonResponseDto } from '@api';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import Button from '../../elements/buttons/button.svelte';
  import Portal from '../../shared-components/portal/portal.svelte';
  import FaceSelection from './face-selection.svelte';
  import { fly } from 'svelte/transition';

  export let album: AlbumResponseDto;

  let peopleSelection = false;
  let locationSelection = false;
  $: selectedFaces = album.rules.map((r) => {
    if (r.key === RuleKey.Person) {
      return String(r.value);
    }
  }) as string[];

  const dispatch = createEventDispatcher<{ close: void }>();

  const handleFaceSelected = (e: CustomEvent<{ people: PersonResponseDto[] }>) => {
    peopleSelection = false;
  };
</script>

<BaseModal
  ignoreClickOutside
  on:close={() => {
    dispatch('close');
  }}
>
  <svelte:fragment slot="title">
    <div class="flex place-items-center gap-2">
      <p class="text-immich-fg dark:text-immich-dark-fg font-medium">Automatically add photos</p>
    </div>
  </svelte:fragment>

  <section class="mb-5 px-5">
    <!--  People Selection -->
    <div id="people-selection">
      <p class="text-sm font-medium">PEOPLE</p>
      <div class="mt-4">
        <button
          class="immich-text-primary border-1 flex h-20 w-20 place-content-center place-items-center rounded-lg border border-gray-300 hover:bg-gray-500/20 dark:border-gray-500"
          on:click={() => (peopleSelection = true)}
        >
          <Plus size="24" />
        </button>
      </div>
    </div>

    <!-- Location Selection -->
    <div id="location-selection" class="mt-5">
      <p class="text-sm font-medium">LOCATION</p>
      <div class="mt-4">
        <button
          class="immich-text-primary border-1 flex w-full place-content-center place-items-center rounded-3xl border border-gray-300 py-2 hover:bg-gray-500/20 dark:border-gray-500"
          on:click={() => (locationSelection = true)}
        >
          <Plus size="24" />
        </button>
      </div>
    </div>

    <!-- Date Selection -->
    <div id="date-selection" class="mt-5">
      <p class="text-sm font-medium">START DATE</p>
      <div class="mt-2">
        <div class="text-xs">
          <p>Only include photos after the set date.</p>
          <p>Include all by default</p>
        </div>

        <div class="mt-4">
          <Button size="sm">Select</Button>
        </div>
      </div>
    </div>

    <!-- Buttons rows -->
    <div>
      <div class="mt-5 flex justify-end gap-2">
        <Button size="sm" color="secondary" on:click={() => dispatch('close')}>Cancel</Button>
        <Button size="sm" color="primary">Confirm</Button>
      </div>
    </div>
  </section>
</BaseModal>

<Portal target="body">
  {#if peopleSelection}
    <section
      transition:fly={{ y: 500 }}
      class="dark:bg-immich-dark-bg absolute left-0 top-0 z-[10000] h-full min-h-max w-full overflow-y-auto bg-gray-200"
    >
      <FaceSelection
        on:close={() => (peopleSelection = false)}
        on:confirm={handleFaceSelected}
        selectedPeopleIds={selectedFaces}
      />
    </section>
  {/if}
</Portal>
