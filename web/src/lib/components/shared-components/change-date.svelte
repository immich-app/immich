<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { DateTime } from 'luxon';
  import ConfirmDialogue from './confirm-dialogue.svelte';
  import Dropdown from '../elements/dropdown.svelte';
  export let initialDate: DateTime = DateTime.now();

  interface ZoneOption {
    zone: string;
    offset: string;
  }

  const timezones: ZoneOption[] = (Intl as any)
    .supportedValuesOf('timeZone')
    .map((zone: string) => ({ zone, offset: 'UTC' + DateTime.local({ zone }).toFormat('ZZ') }));

  const initialOption = timezones.find((item) => item.offset === 'UTC' + initialDate.toFormat('ZZ'));

  let selectedDate = initialDate.toFormat("yyyy-MM-dd'T'HH:mm");
  let selectedTimezone = initialOption?.offset || null;
  let disabled = false;

  const dispatch = createEventDispatcher<{
    cancel: void;
    confirm: string;
  }>();

  const handleSelect = (item: ZoneOption) => (selectedTimezone = item.offset);
  const handleCancel = () => dispatch('cancel');
  const handleConfirm = () => {
    let date = DateTime.fromISO(selectedDate);
    if (selectedTimezone != null) {
      date = date.setZone(selectedTimezone);
    }

    const value = date.toISO();
    if (value) {
      disabled = true;
      dispatch('confirm', value);
    }
  };
</script>

<ConfirmDialogue
  confirmColor="primary"
  cancelColor="secondary"
  title="Change Date"
  prompt="Please select a new date:"
  {disabled}
  on:confirm={handleConfirm}
  on:cancel={handleCancel}
>
  <div class="flex flex-col text-md px-4 py-5 text-center gap-2" slot="prompt">
    <div class="mt-2" />
    <div class="flex flex-col">
      <label for="datetime">Date and Time</label>
      <input
        class="immich-form-label text-sm mt-2 w-full text-black"
        id="datetime"
        type="datetime-local"
        bind:value={selectedDate}
      />
    </div>
    <div class="flex flex-col w-full">
      <label for="timezone">Timezone</label>
      <Dropdown
        selectedOption={initialOption}
        options={timezones}
        render={(item) => (item ? `${item.zone} (${item.offset})` : '(not selected)')}
        on:select={({ detail: item }) => handleSelect(item)}
      />
    </div>
  </div>
</ConfirmDialogue>
