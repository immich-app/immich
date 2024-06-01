<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { mdiCake } from '@mdi/js';
  import DateInput from '../elements/date-input.svelte';

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

<FullScreenModal title="Set date of birth" icon={mdiCake} onClose={handleCancel}>
  <div class="text-immich-primary dark:text-immich-dark-primary">
    <p class="text-sm dark:text-immich-dark-fg">
      Date of birth is used to calculate the age of this person at the time of a photo.
    </p>
  </div>

  <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off" id="set-birth-date-form">
    <div class="my-4 flex flex-col gap-2">
      <DateInput
        class="immich-form-input"
        id="birthDate"
        name="birthDate"
        type="date"
        bind:value={birthDate}
        max={todayFormatted}
      />
    </div>
  </form>
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={() => handleCancel()}>Cancel</Button>
    <Button type="submit" fullwidth form="set-birth-date-form">Set</Button>
  </svelte:fragment>
</FullScreenModal>
