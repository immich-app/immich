<script lang="ts">
  import BaseModal from '$lib/components/shared-components/base-modal.svelte';
  import { createEventDispatcher } from 'svelte';
  import { AlbumResponseDto } from '@api';

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

  <div>
    <div>
      <p>Select people</p>
      <div>People selection box</div>
    </div>
  </div>
</BaseModal>
