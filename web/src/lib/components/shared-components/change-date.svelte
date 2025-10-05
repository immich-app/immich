<script lang="ts">
  import DateInput from '$lib/elements/DateInput.svelte';
  import DurationInput from '$lib/elements/DurationInput.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { getDateTimeOffsetLocaleString } from '$lib/utils/timeline-util.js';
  import { ConfirmModal, Field, Switch } from '@immich/ui';
  import { mdiCalendarEditOutline } from '@mdi/js';
  import { DateTime, Duration } from 'luxon';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import Combobox, { type ComboBoxOption } from './combobox.svelte';

  interface Props {
    title?: string;
    initialDate?: DateTime;
    initialTimeZone?: string;
    timezoneInput?: boolean;
    withDuration?: boolean;
    currentInterval?: { start: DateTime; end: DateTime };
    onCancel: () => void;
    onConfirm: (result: AbsoluteResult | RelativeResult) => void;
  }

  let {
    initialDate = DateTime.now(),
    initialTimeZone = '',
    title = $t('edit_date_and_time'),
    timezoneInput = true,
    withDuration = true,
    currentInterval = undefined,
    onCancel,
    onConfirm,
  }: Props = $props();

  export type AbsoluteResult = {
    mode: 'absolute';
    date: string;
  };

  export type RelativeResult = {
    mode: 'relative';
    duration?: number;
    timeZone?: string;
  };

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

  let showRelative = $state(false);

  let selectedDuration = $state(0);

  const knownTimezones = Intl.supportedValuesOf('timeZone');

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let selectedDate = $state(initialDate.toFormat("yyyy-MM-dd'T'HH:mm"));
  // Use a fixed modern date to calculate stable timezone offsets for the list
  // This ensures that the offsets shown in the combobox are always current,
  // regardless of the historical date selected by the user.
  let timezones: ZoneOption[] = knownTimezones
    .map((zone) => zoneOptionForDate(zone, selectedDate))
    .filter((zone) => zone.valid)
    .sort((zoneA, zoneB) => sortTwoZones(zoneA, zoneB));
  // the offsets (and validity) for time zones may change if the date is changed, which is why we recompute the list
  let selectedAbsoluteOption: ZoneOption | undefined = $state(
    getPreferredTimeZone(userTimeZone, timezones, initialDate),
  );
  let selectedRelativeOption: ZoneOption | undefined = $state(undefined);

  function zoneOptionForDate(zone: string, date: string) {
    const { offsetMinutes, offsetFormat: zoneOffsetAtDate } = getModernOffsetForZoneAndDate(zone, date);
    // For validity, we still need to check if the exact date/time exists in the *original* timezone (for gaps/overlaps).
    const dateForValidity = DateTime.fromISO(date, { zone });
    const valid = dateForValidity.isValid && date === dateForValidity.toFormat("yyyy-MM-dd'T'HH:mm");
    return {
      value: zone,
      offsetMinutes,
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
    userTimeZone: string,
    timezones: ZoneOption[],
    date?: DateTime,
    selectedOption?: ZoneOption,
  ) {
    const offset = date?.offset;
    const previousSelection = timezones.find((item) => item.value === selectedOption?.value);
    const fromInitialTimeZone = timezones.find((item) => item.value === initialTimeZone);
    let sameAsUserTimeZone;
    let firstWithSameOffset;
    if (offset !== undefined) {
      sameAsUserTimeZone = timezones.find((item) => item.offsetMinutes === offset && item.value === userTimeZone);
      firstWithSameOffset = timezones.find((item) => item.offsetMinutes === offset);
    }
    const utcFallback = {
      label: 'UTC (+00:00)',
      offsetMinutes: 0,
      value: 'UTC',
      valid: true,
    };
    return previousSelection ?? fromInitialTimeZone ?? sameAsUserTimeZone ?? firstWithSameOffset ?? utcFallback;
  }

  function getModernOffsetForZoneAndDate(
    zone: string,
    dateString: string,
  ): { offsetMinutes: number; offsetFormat: string } {
    const dt = DateTime.fromISO(dateString, { zone });

    // we determine the *modern* offset for this zone based on its current rules.
    // To do this, we "move" the date to the current year, keeping the local time components.
    // This allows Luxon to apply current-year DST rules.
    const modernYearDt = dt.set({ year: DateTime.now().year });

    // Calculate the offset at that modern year's date.
    const modernOffsetMinutes = modernYearDt.setZone(zone, { keepLocalTime: true }).offset;
    const modernOffsetFormat = modernYearDt.setZone(zone, { keepLocalTime: true }).toFormat('ZZ');

    return { offsetMinutes: modernOffsetMinutes, offsetFormat: modernOffsetFormat };
  }

  function sortTwoZones(zoneA: ZoneOption, zoneB: ZoneOption) {
    let offsetDifference = zoneA.offsetMinutes - zoneB.offsetMinutes;
    if (offsetDifference != 0) {
      return offsetDifference;
    }
    return zoneA.value.localeCompare(zoneB.value, undefined, { sensitivity: 'base' });
  }

  const handleConfirm = () => {
    if (!showRelative && date.isValid && selectedAbsoluteOption) {
      // Get the local date/time components from the selected string using neutral timezone
      const dtComponents = DateTime.fromISO(selectedDate, { zone: 'utc' });

      // Determine the modern, DST-aware offset for the selected IANA zone
      const { offsetMinutes } = getModernOffsetForZoneAndDate(selectedAbsoluteOption.value, selectedDate);

      // Construct the final ISO string with a fixed-offset zone.
      const fixedOffsetZone = `UTC${offsetMinutes >= 0 ? '+' : ''}${Duration.fromObject({ minutes: offsetMinutes }).toFormat('hh:mm')}`;

      // Create a DateTime object in this fixed-offset zone, preserving the local time.
      const finalDateTime = DateTime.fromObject(dtComponents.toObject(), { zone: fixedOffsetZone });

      onConfirm({ mode: 'absolute', date: finalDateTime.toISO({ includeOffset: true })! });
    }

    if (showRelative && (selectedDuration || selectedRelativeOption)) {
      onConfirm({ mode: 'relative', duration: selectedDuration, timeZone: selectedRelativeOption?.value });
    }
  };

  const handleOnSelect = (option?: ComboBoxOption) => {
    if (showRelative) {
      selectedRelativeOption = option
        ? getPreferredTimeZone(userTimeZone, timezones, undefined, option as ZoneOption)
        : undefined;
    } else {
      if (option) {
        selectedAbsoluteOption = getPreferredTimeZone(userTimeZone, timezones, initialDate, option as ZoneOption);
      }
    }
  };

  let selectedOption = $derived(showRelative ? selectedRelativeOption : selectedAbsoluteOption);

  // when changing the time zone, assume the configured date/time is meant for that time zone (instead of updating it)
  let date = $derived(DateTime.fromISO(selectedDate, { zone: selectedAbsoluteOption?.value, setZone: true }));

  export function calcNewDate(timestamp: DateTime, selectedDuration: number, timezone?: string) {
    timestamp = timestamp.plus({ minutes: selectedDuration });
    if (timezone) {
      timestamp = timestamp.setZone(timezone);
    }
    return getDateTimeOffsetLocaleString(timestamp, { locale: get(locale) });
  }

  let intervalFrom = $derived.by(() =>
    currentInterval ? calcNewDate(currentInterval.start, selectedDuration, selectedRelativeOption?.value) : undefined,
  );
  let intervalTo = $derived.by(() =>
    currentInterval ? calcNewDate(currentInterval.end, selectedDuration, selectedRelativeOption?.value) : undefined,
  );
</script>

<ConfirmModal
  confirmColor="primary"
  {title}
  icon={mdiCalendarEditOutline}
  prompt="Please select a new date:"
  disabled={!date.isValid}
  onClose={(confirmed) => (confirmed ? handleConfirm() : onCancel())}
>
  {#snippet promptSnippet()}
    {#if withDuration}
      <div class="mb-5">
        <Field label={$t('edit_date_and_time_by_offset')}>
          <Switch data-testid="edit-by-offset-switch" bind:checked={showRelative} />
        </Field>
      </div>
    {/if}
    <div class="flex flex-col text-start min-h-[140px]">
      <div>
        <div class="flex flex-col" style="display: {showRelative ? 'none' : 'flex'}">
          <label for="datetime">{$t('date_and_time')}</label>
          <DateInput class="immich-form-input" id="datetime" type="datetime-local" bind:value={selectedDate} />
        </div>
        <div class="flex flex-col" style="display: {showRelative ? 'flex' : 'none'}">
          <div class="flex flex-col">
            <label for="relativedatetime">{$t('offset')}</label>
            <DurationInput class="immich-form-input" id="relativedatetime" bind:value={selectedDuration} />
          </div>
        </div>
        {#if timezoneInput}
          <div>
            <Combobox
              bind:selectedOption
              label={$t('timezone')}
              options={timezones}
              placeholder={$t('search_timezone')}
              onSelect={(option) => handleOnSelect(option)}
            />
          </div>
        {/if}
        <div class="flex flex-col" style="display: {showRelative && currentInterval ? 'flex' : 'none'}">
          <span data-testid="interval-preview"
            >{$t('edit_date_and_time_by_offset_interval', { values: { from: intervalFrom, to: intervalTo } })}</span
          >
        </div>
      </div>
    </div>
  {/snippet}
</ConfirmModal>
