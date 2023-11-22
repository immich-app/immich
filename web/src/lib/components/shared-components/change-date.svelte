<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FullScreenModal from './full-screen-modal.svelte';
  import Button from '../elements/buttons/button.svelte';
  import type { Color } from '$lib/components/elements/buttons/button.svelte';
  import { DateTime } from 'luxon';
  export let title = 'Change Date';
  export let prompt = 'Please select a new date:';
  export let confirmText = 'Confirm';
  export let confirmColor: Color = 'primary';
  export let cancelText = 'Cancel';
  export let cancelColor: Color = 'secondary';
  export let hideCancelButton = false;
  export let initialDate: DateTime = DateTime.now();

  let selectedDate: string;
  let selectedTimezone: string | null;

  let timezones = [
    '',
    'UTC-12:00',
    'UTC-11:00',
    'UTC-10:00',
    'UTC-09:30',
    'UTC-09:00',
    'UTC-08:00',
    'UTC-07:00',
    'UTC-06:00',
    'UTC-05:00',
    'UTC-04:00',
    'UTC-03:30',
    'UTC-03:00',
    'UTC-02:00',
    'UTC-01:00',
    'UTC+00:00',
    'UTC+01:00',
    'UTC+02:00',
    'UTC+03:00',
    'UTC+03:30',
    'UTC+04:00',
    'UTC+04:30',
    'UTC+05:00',
    'UTC+05:30',
    'UTC+05:45',
    'UTC+06:00',
    'UTC+06:30',
    'UTC+07:00',
    'UTC+08:00',
    'UTC+08:45',
    'UTC+09:00',
    'UTC+09:30',
    'UTC+10:00',
    'UTC+10:30',
    'UTC+11:00',
    'UTC+12:00',
    'UTC+12:45',
    'UTC+13:00',
    'UTC+14:00',
  ];

  selectedDate = initialDate.toFormat("yyyy-MM-dd'T'HH:mm");
  selectedTimezone = 'UTC' + initialDate.toFormat('ZZ');

  const dispatch = createEventDispatcher();

  let isConfirmButtonDisabled = false;

  const handleCancel = () => dispatch('cancel');
  const handleEscape = () => {
    if (!isConfirmButtonDisabled) {
      dispatch('cancel');
    }
  };

  const handleConfirm = () => {
    let date = DateTime.fromISO(selectedDate);
    if (selectedTimezone != null) {
      date = date.setZone(selectedTimezone);
    }

    isConfirmButtonDisabled = true;
    dispatch('confirm', date.toISO());
  };
</script>

<FullScreenModal on:clickOutside={handleCancel} on:escape={() => handleEscape()}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <h1 class="pb-2 text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">
        {title}
      </h1>
    </div>
    <div>
      <div class="text-md px-4 py-5 text-center">
        <slot name="prompt">
          <p>{prompt}</p>
        </slot>
        <div class="mt-2" />
        <div class="flex flex-col">
          <label for="datetime">Date and Time</label>
          <input id="datetime" type="datetime-local" bind:value={selectedDate} class="mt-2 w-full text-black" />
        </div>
        <div class="flex flex-col">
          <label for="timezone">Timezone</label>
          <select id="timezone" bind:value={selectedTimezone} class="mt-2 w-full text-black">
            {#each timezones as timezone}
              <option value={timezone}>{timezone || 'Choose a timezone'}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="mt-4 flex w-full gap-4 px-4">
        {#if !hideCancelButton}
          <Button color={cancelColor} fullwidth on:click={handleCancel}>
            {cancelText}
          </Button>
        {/if}
        <Button color={confirmColor} fullwidth on:click={handleConfirm} disabled={isConfirmButtonDisabled}>
          {confirmText}
        </Button>
      </div>
    </div>
  </div>
</FullScreenModal>
