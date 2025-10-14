<script lang="ts">
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import DateSelectionModal from '$lib/modals/DateSelectionModal.svelte';
  import { user } from '$lib/stores/user.store';
  import { getSelectedAssets } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { fromTimelinePlainDateTime } from '$lib/utils/timeline-util.js';
  import { updateAssets } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { mdiCalendarEditOutline } from '@mdi/js';
  import { DateTime, Duration } from 'luxon';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  interface Props {
    menuItem?: boolean;
  }

  let { menuItem = false }: Props = $props();
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const getCurrentInterval = () => {
    const ids = getSelectedAssets(getOwnedAssets(), $user);
    const assets = getOwnedAssets().filter((asset) => ids.includes(asset.id));
    const imageTimestamps = assets.map((asset) => {
      let localDateTime = fromTimelinePlainDateTime(asset.localDateTime);
      let fileCreatedAt = fromTimelinePlainDateTime(asset.fileCreatedAt);
      let offsetMinutes = localDateTime.diff(fileCreatedAt, 'minutes').shiftTo('minutes').minutes;
      const timeZone = `UTC${offsetMinutes >= 0 ? '+' : ''}${Duration.fromObject({ minutes: offsetMinutes }).toFormat('hh:mm')}`;
      return fileCreatedAt.setZone('utc', { keepLocalTime: true }).setZone(timeZone);
    });
    let minTimestamp = imageTimestamps[0];
    let maxTimestamp = imageTimestamps[0];
    for (let current of imageTimestamps) {
      if (current < minTimestamp) {
        minTimestamp = current;
      }

      if (current > maxTimestamp) {
        maxTimestamp = current;
      }
    }
    return { start: minTimestamp, end: maxTimestamp };
  };

  const showChangeDate = async () => {
    const result = await modalManager.show(DateSelectionModal, {
      initialDate: DateTime.now(),
      currentInterval: getCurrentInterval(),
    });
    if (!result) {
      return;
    }

    const ids = getSelectedAssets(getOwnedAssets(), $user);

    try {
      if (result.mode === 'absolute') {
        await updateAssets({ assetBulkUpdateDto: { ids, dateTimeOriginal: result.date } });
      } else if (result.mode === 'relative') {
        await updateAssets({
          assetBulkUpdateDto: {
            ids,
            dateTimeRelative: result.duration,
            timeZone: result.timeZone,
          },
        });
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_date'));
    }
    clearSelect();
  };
</script>

{#if menuItem}
  <MenuOption text={$t('change_date')} icon={mdiCalendarEditOutline} onClick={showChangeDate} />
{/if}
