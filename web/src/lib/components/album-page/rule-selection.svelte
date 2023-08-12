<script lang="ts">
  import BaseModal from '$lib/components/shared-components/base-modal.svelte';
  import { createEventDispatcher } from 'svelte';
  import { AlbumResponseDto } from '@api';
  import Plus from 'svelte-material-icons/Plus.svelte';

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
      <p class="font-medium text-immich-fg dark:text-immich-dark-fg">Automatically add photos</p>
    </div>
  </svelte:fragment>

  <section class="px-5">
    <!--  People Selection -->
    <div id="people-selection">
      <p class="text-sm">PEOPLE</p>
      <div class="mt-4">
        <button
          class="flex h-20 w-20 place-content-center place-items-center rounded-lg border border-gray-300 text-immich-primary"
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
          class="flex h-20 w-20 place-content-center place-items-center rounded-lg border border-gray-300 text-immich-primary"
        >
          <Plus size="24" />
        </button>
      </div>
    </div>

    <!-- Date Selection -->
    <div id="date-selection" class="mt-5">
      <p class="text-sm">START DATE</p>
      <div class="mt-4">
        <button
          class="flex h-20 w-20 place-content-center place-items-center rounded-lg border border-gray-300 text-immich-primary"
        >
          <Plus size="24" />
        </button>
      </div>
    </div>
  </section>
</BaseModal>
