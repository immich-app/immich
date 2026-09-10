<script lang="ts">
  import Combobox from '$lib/components/shared-components/Combobox.svelte';
  import { dateFormats } from '$lib/constants';
  import DateInput from '$lib/elements/DateInput.svelte';
  import DurationInput from '$lib/elements/DurationInput.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import {
    calcNewDate,
    getPreferredTimeZone,
    getTimezones,
    toIsoDate,
    type ZoneOption,
  } from '$lib/modals/timezone-utils';
  import { locale } from '$lib/stores/preferences.store';
  import { getOwnedAssetsWithWarning } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { Field, FormModal, Label, Switch, Text } from '@immich/ui';
  import { mdiCalendarEdit } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    initialDate?: DateTime;
    initialTimeZone?: string;
    assets: TimelineAsset[];
    onClose: (success: boolean) => void;
  }
  let { initialDate = DateTime.now(), initialTimeZone, assets, onClose }: Props = $props();

  let showRelative = $state(false);
  let selectedDuration = $state(0);
  let selectedDate = $state(initialDate.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS"));
  const timezones = $derived(getTimezones(selectedDate));
  // svelte-ignore state_referenced_locally
  let lastSelectedTimezone = $state(getPreferredTimeZone(initialDate, initialTimeZone, timezones));
  // the offsets (and validity) for time zones may change if the date is changed, which is why we recompute the list
  let selectedOption = $derived(getPreferredTimeZone(initialDate, initialTimeZone, timezones, lastSelectedTimezone));

  // get the first and last date range when doing a change by offset
  const dateRange = $derived.by(() => {
    let first = undefined;
    let last = undefined;
    for (const asset of assets) {
      const date = DateTime.fromObject(asset.localDateTime, { zone: asset.localOffsetHours ? 'local' : 'UTC' });
      if (!first || first > date) {
        first = date;
      }
      if (!last || last < date) {
        last = date;
      }
    }

    first = showRelative && first ? calcNewDate(first, selectedDuration, selectedOption?.value) : first;
    last = showRelative && last ? calcNewDate(last, selectedDuration, selectedOption?.value) : last;
    return {
      first: first?.toLocaleString(dateFormats.fullDateTime, { locale: $locale }) ?? '',
      last: last?.toLocaleString(dateFormats.fullDateTime, { locale: $locale }) ?? '',
    };
  });

  const onSubmit = async () => {
    const ids = getOwnedAssetsWithWarning(assets, authManager.user);
    try {
      if (showRelative && (selectedDuration || selectedOption)) {
        await updateAssets({
          assetBulkUpdateDto: {
            ids,
            dateTimeRelative: selectedDuration,
            timeZone: selectedOption?.value,
          },
        });

        const updatedAssets = assets.filter((a) => authManager.user && a.ownerId === authManager.user.id);
        for (const asset of updatedAssets) {
          asset.localOffsetHours = selectedOption.offsetMinutes / 60;
        }

        onClose(true);
        return;
      }
      const isoDate = toIsoDate(selectedDate, selectedOption);
      await updateAssets({ assetBulkUpdateDto: { ids, dateTimeOriginal: isoDate } });
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_date'));
      onClose(false);
    }
  };

  // when changing the time zone, assume the configured date/time is meant for that time zone (instead of updating it)
  const date = $derived(DateTime.fromISO(selectedDate, { zone: selectedOption?.value, setZone: true }));
</script>

<FormModal
  title={$t('edit_date_and_time')}
  icon={mdiCalendarEdit}
  onClose={() => onClose(false)}
  {onSubmit}
  submitText={$t('confirm')}
  disabled={!date.isValid}
  size="small"
>
  <Field label={$t('edit_date_and_time_by_offset')}>
    <Switch data-testid="edit-by-offset-switch" bind:checked={showRelative} class="mb-2" />
  </Field>
  {#if showRelative}
    <Label for="relativedatetime" class="mb-1 block">{$t('offset')}</Label>
    <DurationInput class="mb-2 immich-form-input w-full" id="relativedatetime" bind:value={selectedDuration} />
  {:else}
    <Label for="datetime" class="mb-1 block">{$t('date_and_time')}</Label>
    <DateInput class="mb-2 immich-form-input w-full" id="datetime" type="datetime-local" bind:value={selectedDate} />
  {/if}
  <div class="w-full">
    <Combobox
      bind:selectedOption
      label={$t('timezone')}
      options={timezones}
      placeholder={$t('search_timezone')}
      onSelect={(option) => (lastSelectedTimezone = option as ZoneOption)}
    ></Combobox>
  </div>
  {#if showRelative}
    <Label for="datetime" class="mt-2 mb-1 block">{$t('new_date_range')}</Label>
    {#if assets.length > 1}
      <Text size="small">{$t('first_date', { values: { date: dateRange.first } })}</Text>
      <Text size="small">{$t('last_date', { values: { date: dateRange.last } })}</Text>
    {:else}
      <Text size="small">{dateRange.first}</Text>
    {/if}
  {/if}
</FormModal>
