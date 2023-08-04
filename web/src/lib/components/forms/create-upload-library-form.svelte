<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FolderSync from 'svelte-material-icons/FolderSync.svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import type { LibraryResponseDto } from '../../../api/open-api';

  export let title = 'Create Library';
  export let cancelText = 'Cancel';
  export let submitText = 'Save';

  export let library: Partial<LibraryResponseDto>;

  const dispatch = createEventDispatcher();
  const handleCancel = () => dispatch('cancel');
  const handleSubmit = () => dispatch('submit', { ...library, libraryType: library.type });
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
  <div
    class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-items-center place-content-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <FolderSync size="4em" />
      <h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">
        {title}
      </h1>
    </div>

    <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="path">Name</label>
        <input class="immich-form-input" id="name" name="name" type="text" bind:value={library.name} />
      </div>

      <div class="flex w-full px-4 gap-4 mt-8">
        <Button color="gray" fullwidth on:click={() => handleCancel()}>{cancelText}</Button>
        <Button type="submit" fullwidth>{submitText}</Button>
      </div>
    </form>
  </div>
</FullScreenModal>
