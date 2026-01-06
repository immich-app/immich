<script lang="ts">
  import Combobox from '$lib/components/shared-components/combobox.svelte';
  import DateInput from '$lib/elements/DateInput.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { getPreferredTimeZone, getTimezones, toIsoDate } from '$lib/modals/timezone-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset } from '@immich/sdk';
  import { FormModal, Label } from '@immich/ui';
  import { mdiCalendarEdit } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    initialDate?: DateTime;
    initialTimeZone?: string;
    timezoneInput?: boolean;
    asset: TimelineAsset;
    onClose: (success: boolean) => void;
  }

  let { initialDate = DateTime.now(), initialTimeZone, timezoneInput = true, asset, onClose }: Props = $props();

  let selectedDate = $state(initialDate.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS"));
  const timezones = $derived(getTimezones(selectedDate));

  // svelte-ignore state_referenced_locally
  let lastSelectedTimezone = $state(getPreferredTimeZone(initialDate, initialTimeZone, timezones));
  // the offsets (and validity) for time zones may change if the date is changed, which is why we recompute the list
  let selectedOption = $derived(getPreferredTimeZone(initialDate, initialTimeZone, timezones, lastSelectedTimezone));

  const onSubmit = async () => {
    if (!date.isValid || !selectedOption) {
      onClose(false);
      return;
    }

    // Get the local date/time components from the selected string using neutral timezone
    const isoDate = toIsoDate(selectedDate, selectedOption);
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { dateTimeOriginal: isoDate } });
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
  disabled={!date.isValid || !selectedOption}
  size="small"
>
  <Label for="datetime" class="block mb-1">{$t('date_and_time')}</Label>
  <DateInput
    class="immich-form-input text-gray-700 w-full mb-2"
    id="datetime"
    type="datetime-local"
    bind:value={selectedDate}
  />
  {#if timezoneInput}
    <div class="w-full">
      <Combobox bind:selectedOption label={$t('timezone')} options={timezones} placeholder={$t('search_timezone')} />
    </div>
  {/if}
</FormModal>
