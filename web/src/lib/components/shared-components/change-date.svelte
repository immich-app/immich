<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { DateTime } from 'luxon';
  import ConfirmDialog from './dialog/confirm-dialog.svelte';
  import Combobox from './combobox.svelte';
  import DateInput from '../elements/date-input.svelte';
  import { t } from 'svelte-i18n';

  export let initialDate: DateTime = DateTime.now();

  type ZoneOption = {
    /**
     * Timezone name
     *
     * e.g. Asia/Jerusalem (+03:00)
     */
    label: string;

    /**
     * Timezone offset
     *
     * e.g. UTC+01:00
     */
    value: string;
  };

  const timezones: ZoneOption[] = Intl.supportedValuesOf('timeZone')
    .map((zone) => DateTime.local({ zone }))
    .sort((zoneA, zoneB) => {
      let numericallyCorrect = zoneA.offset - zoneB.offset;
      if (numericallyCorrect != 0) {
        return numericallyCorrect;
      }
      return zoneA.zoneName.localeCompare(zoneB.zoneName, undefined, { sensitivity: 'base' });
    })
    .map((zone) => {
      const offset = zone.toFormat('ZZ');
      return {
        label: `${zone.zoneName} (${offset})`,
        value: 'UTC' + offset,
      };
    });

  const initialOption = timezones.find((item) => item.value === 'UTC' + initialDate.toFormat('ZZ'));

  let selectedOption = initialOption && {
    label: initialOption?.label || '',
    value: initialOption?.value || '',
  };

  let selectedDate = initialDate.toFormat("yyyy-MM-dd'T'HH:mm");

  // Keep local time if not it's really confusing
  $: date = DateTime.fromISO(selectedDate).setZone(selectedOption?.value, { keepLocalTime: true });

  const dispatch = createEventDispatcher<{
    cancel: void;
    confirm: string;
  }>();

  const handleCancel = () => dispatch('cancel');

  const handleConfirm = () => {
    const value = date.toISO();
    if (value) {
      dispatch('confirm', value);
    }
  };
</script>

<ConfirmDialog
  confirmColor="primary"
  title={$t('edit_date_and_time')}
  prompt="Please select a new date:"
  disabled={!date.isValid}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
>
  <div class="flex flex-col text-md px-4 text-center gap-2" slot="prompt">
    <div class="flex flex-col">
      <label for="datetime">{$t('date_and_time')}</label>
      <DateInput
        class="immich-form-input text-sm my-4 w-full"
        id="datetime"
        type="datetime-local"
        bind:value={selectedDate}
      />
    </div>
    <div class="flex flex-col w-full mt-2">
      <Combobox bind:selectedOption label={$t('timezone')} options={timezones} placeholder={$t('search_timezone')} />
    </div>
  </div>
</ConfirmDialog>
