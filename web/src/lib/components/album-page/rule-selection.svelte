<script lang="ts">
  import BaseModal from '$lib/components/shared-components/base-modal.svelte';
  import { createEventDispatcher } from 'svelte';
  import { AlbumResponseDto } from '@api';

  export let album: AlbumResponseDto;
  const dispatch = createEventDispatcher();
</script>

<BaseModal
  on:close={() => {
    dispatch('close');
  }}
>
  <svelte:fragment slot="title">
    <span class="flex place-items-center gap-2">
      <p class="font-medium text-immich-fg dark:text-immich-dark-fg">Select people & rule</p>
    </span>
  </svelte:fragment>
</BaseModal>
