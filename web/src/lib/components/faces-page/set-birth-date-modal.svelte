<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Cake from 'svelte-material-icons/Cake.svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';

  export let birthDate: string;

  const dispatch = createEventDispatcher();
  const handleCancel = () => dispatch('cancel');
  const handleSubmit = () => dispatch('submit', birthDate);
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <Cake size="4em" />
      <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Set date of birth</h1>
    </div>

    <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
      <p class="p-5 text-sm">
        Date of birth will be used to calculate the age of this person when viewing their photos.
      </p>
      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="birthDate">Date of birth</label>
        <input
          class="immich-form-input"
          id="birthDate"
          name="birthDate"
          type="date"
          bind:value={birthDate}
        />
      </div>
      <div class="mt-8 flex w-full gap-4 px-4">
        <Button color="gray" fullwidth on:click={() => handleCancel()}>Cancel</Button>
        <Button type="submit" fullwidth>Ok</Button>
      </div>
    </form>
  </div>
</FullScreenModal>
