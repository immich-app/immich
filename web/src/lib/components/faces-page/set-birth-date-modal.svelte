<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { mdiCake } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';

  export let birthDate: string;

  const dispatch = createEventDispatcher<{
    close: void;
    updated: string;
  }>();

  const todayFormatted = new Date().toISOString().split('T')[0];

  const handleCancel = () => dispatch('close');
  const handleSubmit = () => {
    dispatch('updated', birthDate);
  };
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <Icon path={mdiCake} size="4em" />
      <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Set date of birth</h1>

      <p class="text-sm dark:text-immich-dark-fg">
        Date of birth is used to calculate the age of this person at the time of a photo.
      </p>
    </div>

    <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
      <div class="m-4 flex flex-col gap-2">
        <input
          class="immich-form-input"
          id="birthDate"
          name="birthDate"
          type="date"
          bind:value={birthDate}
          max={todayFormatted}
        />
      </div>
      <div class="mt-8 flex w-full gap-4 px-4">
        <Button color="gray" fullwidth on:click={() => handleCancel()}>Cancel</Button>
        <Button type="submit" fullwidth>Set</Button>
      </div>
    </form>
  </div>
</FullScreenModal>
