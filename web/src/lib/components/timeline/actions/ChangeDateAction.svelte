<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { DateChangeResult } from '$lib/modals/AssetSelectionChangeDateModal.svelte';
  import AssetSelectionChangeDateModal from '$lib/modals/AssetSelectionChangeDateModal.svelte';
  import type { TimelineDateTime } from '$lib/utils/timeline-util';
  import { modalManager } from '@immich/ui';
  import { mdiCalendarEditOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    menuItem?: boolean;
    onDateChange?: (ids: string[], updateAsset: (asset: TimelineAsset) => void) => void;
  }

  let { menuItem = false, onDateChange }: Props = $props();
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleChangeDate = async () => {
    const result = await modalManager.show(AssetSelectionChangeDateModal, {
      initialDate: DateTime.now(),
      assets: getOwnedAssets(),
    });
    if (result) {
      const ids = result.assets.map((a) => a.id);
      onDateChange?.(ids, (asset) => {
        const updatedDateTime = getUpdatedDateTime(asset, result);
        asset.localDateTime = updatedDateTime.toObject() as TimelineDateTime;
      });
      clearSelect();
    }
  };

  function getUpdatedDateTime(asset: TimelineAsset, result: DateChangeResult): DateTime {
    const { localDateTime } = asset;
    const currentDateTime = DateTime.fromObject(localDateTime, { zone: result.timeZone });

    return result.type === 'relative' ? currentDateTime.plus({ minutes: result.offsetMinutes }) : result.newDateTime;
  }
</script>

{#if menuItem}
  <MenuOption text={$t('change_date')} icon={mdiCalendarEditOutline} onClick={handleChangeDate} />
{/if}
