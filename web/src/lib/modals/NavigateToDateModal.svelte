<script lang="ts">
  import DateInput from '$lib/elements/DateInput.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { getPreferredTimeZone, getTimezones, toDatetime, type ZoneOption } from '$lib/modals/timezone-utils';
  import { FormModal, HStack, VStack } from '@immich/ui';
  import { mdiNavigationVariantOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    timelineManager: TimelineManager;
    onClose: (asset?: TimelineAsset) => void;
  }

  let { timelineManager, onClose }: Props = $props();

  const initialDate = DateTime.now();
  let selectedDate = $state(initialDate.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS"));
  const timezones = $derived(getTimezones(selectedDate));
  // the offsets (and validity) for time zones may change if the date is changed, which is why we recompute the list
  let selectedOption: ZoneOption | undefined = $derived(getPreferredTimeZone(initialDate, undefined, timezones));

  const onSubmit = async () => {
    if (!date.isValid || !selectedOption) {
      onClose();
      return;
    }

    // Get the local date/time components from the selected string using neutral timezone
    const dateTime = toDatetime(selectedDate, selectedOption) as DateTime<true>;
    const asset = await timelineManager.getClosestAssetToDate(dateTime.toObject());
    onClose(asset);
  };

  // when changing the time zone, assume the configured date/time is meant for that time zone (instead of updating it)
  const date = $derived(DateTime.fromISO(selectedDate, { zone: selectedOption?.value, setZone: true }));
</script>

<FormModal
  title={$t('navigate_to_time')}
  icon={mdiNavigationVariantOutline}
  onClose={() => onClose()}
  {onSubmit}
  submitText={$t('confirm')}
  disabled={!date.isValid || !selectedOption}
  size="medium"
>
  <VStack fullWidth>
    <HStack fullWidth>
      <label class="immich-form-label" for="datetime">{$t('date_and_time')}</label>
    </HStack>
    <HStack fullWidth>
      <DateInput
        class="immich-form-input text-gray-700 w-full"
        id="datetime"
        type="datetime-local"
        bind:value={selectedDate}
      />
    </HStack>
  </VStack>
</FormModal>
