<script lang="ts">
  import AssetChangeDateModal from '$lib/modals/AssetChangeDateModal.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { fromISODateTime, fromISODateTimeUTC, toTimelineAsset } from '$lib/utils/timeline-util';
  import { type AssetResponseDto } from '@immich/sdk';
  import { Icon, modalManager } from '@immich/ui';
  import { mdiCalendar, mdiPencil } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let timeZone = $derived(asset.exifInfo?.timeZone ?? undefined);
  let dateTime = $derived(
    timeZone && asset.exifInfo?.dateTimeOriginal
      ? fromISODateTime(asset.exifInfo.dateTimeOriginal, timeZone)
      : fromISODateTimeUTC(asset.localDateTime),
  );

  const handleChangeDate = async () => {
    if (!isOwner) {
      return;
    }

    await modalManager.show(AssetChangeDateModal, {
      asset: toTimelineAsset(asset),
      initialDate: dateTime,
      initialTimeZone: timeZone,
    });
  };
</script>

{#if dateTime}
  <button
    type="button"
    class="flex w-full text-start justify-between place-items-start gap-4 py-4"
    onclick={handleChangeDate}
    title={isOwner ? $t('edit_date') : ''}
    class:hover:text-primary={isOwner}
  >
    <div class="flex gap-4">
      <div>
        <Icon icon={mdiCalendar} size="24" />
      </div>

      <div>
        <p>
          {dateTime.toLocaleString(
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            },
            { locale: $locale },
          )}
        </p>
        <div class="flex gap-2 text-sm">
          <p>
            {dateTime.toLocaleString(
              {
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: timeZone ? 'longOffset' : undefined,
              },
              { locale: $locale },
            )}
          </p>
        </div>
      </div>
    </div>

    {#if isOwner}
      <div class="p-1">
        <Icon icon={mdiPencil} size="20" />
      </div>
    {/if}
  </button>
{:else if !dateTime && isOwner}
  <div class="flex justify-between place-items-start gap-4 py-4">
    <div class="flex gap-4">
      <div>
        <Icon icon={mdiCalendar} size="24" />
      </div>
    </div>
    <div class="p-1">
      <Icon icon={mdiPencil} size="20" />
    </div>
  </div>
{/if}
