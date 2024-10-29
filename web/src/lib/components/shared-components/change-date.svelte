<script lang="ts">
  import { DateTime } from 'luxon';
  import ConfirmDialog from './dialog/confirm-dialog.svelte';
  import Combobox from './combobox.svelte';
  import DateInput from '../elements/date-input.svelte';
  import { t } from 'svelte-i18n';

  export let initialDate: DateTime = DateTime.now();
  export let initialTimeZone: string = '';
  export let onCancel: () => void;
  export let onConfirm: (date: string) => void;

  type ZoneOption = {
    /**
     * Timezone name with offset
     *
     * e.g. Asia/Jerusalem (+03:00)
     */
    label: string;

    /**
     * Timezone name
     *
     * e.g. Asia/Jerusalem
     */
    value: string;

    /**
     * Timezone offset in minutes
     *
     * e.g. 300
     */
    offsetMinutes: number;

    /**
     * True iff the date is valid
     *
     * Dates may be invalid for various reasons, for example setting a day that does not exist (30 Feb 2024).
     * Due to daylight saving time, 2:30am is invalid for Europe/Berlin on Mar 31 2024.The two following local times
     * are one second apart:
     *
     * - Mar 31 2024 01:59:59 (GMT+0100, unix timestamp 1725058799)
     * - Mar 31 2024 03:00:00 (GMT+0200, unix timestamp 1711846800)
     *
     * Mar 31 2024 02:30:00 does not exist in Europe/Berlin, this is an invalid date/time/time zone combination.
     */
    valid: boolean;
  };

  const knownTimezones = Intl.supportedValuesOf('timeZone');

  let timezones: ZoneOption[];
  $: timezones = knownTimezones
    .map((zone) => zoneOptionForDate(zone, selectedDate))
    .filter((zone) => zone.valid)
    .sort((zoneA, zoneB) => sortTwoZones(zoneA, zoneB));

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // the offsets (and validity) for time zones may change if the date is changed, which is why we recompute the list
  let selectedOption: ZoneOption | undefined;
  $: selectedOption = getPreferredTimeZone(initialDate, userTimeZone, timezones, selectedOption);

  let selectedDate = initialDate.toFormat("yyyy-MM-dd'T'HH:mm");

  // when changing the time zone, assume the configured date/time is meant for that time zone (instead of updating it)
  $: date = DateTime.fromISO(selectedDate, { zone: selectedOption?.value, setZone: true });

  function zoneOptionForDate(zone: string, date: string) {
    const dateAtZone: DateTime = DateTime.fromISO(date, { zone });
    const zoneOffsetAtDate = dateAtZone.toFormat('ZZ');
    const valid = dateAtZone.isValid && date.toString() === dateAtZone.toFormat("yyyy-MM-dd'T'HH:mm");
    return {
      value: zone,
      offsetMinutes: dateAtZone.offset,
      label: zone + ' (' + zoneOffsetAtDate + ')' + (valid ? '' : ' [invalid date!]'),
      valid,
    };
  }

  /*
   * If the time zone is not given, find the timezone to select for a given time, date, and offset (e.g. +02:00).
   *
   * This is done so that the list shown to the user includes more helpful names like "Europe/Berlin (+02:00)"
   * instead of just the raw offset or something like "UTC+02:00".
   *
   * The provided information (initialDate, from some asset) includes the offset (e.g. +02:00), but no information about
   * the actual time zone. As several countries/regions may share the same offset, for example Berlin (Germany) and
   * Blantyre (Malawi) sharing +02:00 in summer, we have to guess and somehow pick a suitable time zone.
   *
   * If the time zone configured by the user (in the browser) provides the same offset for the given date (accounting
   * for daylight saving time and other weirdness), we prefer to show it. This way, for German users, we might be able
   * to show "Europe/Berlin" instead of the lexicographically first entry "Africa/Blantyre".
   */
  function getPreferredTimeZone(
    date: DateTime,
    userTimeZone: string,
    timezones: ZoneOption[],
    selectedOption?: ZoneOption,
  ) {
    const offset = date.offset;
    const previousSelection = timezones.find((item) => item.value === selectedOption?.value);
    const fromInitialTimeZone = timezones.find((item) => item.value === initialTimeZone);
    const sameAsUserTimeZone = timezones.find((item) => item.offsetMinutes === offset && item.value === userTimeZone);
    const firstWithSameOffset = timezones.find((item) => item.offsetMinutes === offset);
    const utcFallback = {
      label: 'UTC (+00:00)',
      offsetMinutes: 0,
      value: 'UTC',
      valid: true,
    };
    return previousSelection ?? fromInitialTimeZone ?? sameAsUserTimeZone ?? firstWithSameOffset ?? utcFallback;
  }

  function sortTwoZones(zoneA: ZoneOption, zoneB: ZoneOption) {
    let offsetDifference = zoneA.offsetMinutes - zoneB.offsetMinutes;
    if (offsetDifference != 0) {
      return offsetDifference;
    }
    return zoneA.value.localeCompare(zoneB.value, undefined, { sensitivity: 'base' });
  }

  const handleConfirm = () => {
    const value = date.toISO();
    if (value) {
      onConfirm(value);
    }
  };
</script>

<ConfirmDialog
  confirmColor="primary"
  title={$t('edit_date_and_time')}
  prompt="Please select a new date:"
  disabled={!date.isValid}
  onConfirm={handleConfirm}
  {onCancel}
>
  <div class="flex flex-col text-left gap-2" slot="prompt">
    <div class="flex flex-col">
      <label for="datetime">{$t('date_and_time')}</label>
      <DateInput class="immich-form-input" id="datetime" type="datetime-local" bind:value={selectedDate} />
    </div>
    <div>
      <Combobox bind:selectedOption label={$t('timezone')} options={timezones} placeholder={$t('search_timezone')} />
    </div>
  </div>
</ConfirmDialog>
