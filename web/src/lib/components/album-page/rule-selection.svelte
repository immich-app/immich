<script lang="ts">
  import BaseModal from '$lib/components/shared-components/base-modal.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { AlbumResponseDto } from '@api';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import Button from '../elements/buttons/button.svelte';

  export let album: AlbumResponseDto;
  const dispatch = createEventDispatcher<{ close: void }>();
</script>

<BaseModal
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
      <p class="text-sm">PEOPLE</p>
      <div class="mt-4">
        <button
          class="immich-text-primary border-1 flex h-20 w-20 place-content-center place-items-center rounded-lg border border-gray-300 hover:bg-gray-500/20 dark:border-gray-500"
        >
          <Plus size="24" />
        </button>
      </div>
    </div>

    <!-- Location Selection -->
    <div id="location-selection" class="mt-5">
      <p class="text-sm">LOCATION</p>
      <div class="mt-4">
        <button
          class="immich-text-primary border-1 flex w-full place-content-center place-items-center rounded-2xl border border-gray-300 py-2 hover:bg-gray-500/20 dark:border-gray-500"
        >
          <Plus size="24" />
        </button>
      </div>
    </div>

    <!-- Date Selection -->
    <div id="date-selection" class="mt-5">
      <p class="text-sm">START DATE</p>
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
  </section>
</BaseModal>
