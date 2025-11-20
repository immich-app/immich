<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import AssetSelectionChangeDateModal from '$lib/modals/AssetSelectionChangeDateModal.svelte';
  import { modalManager } from '@immich/ui';
  import { mdiCalendarEditOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';
  interface Props {
    menuItem?: boolean;
  }

  let { menuItem = false }: Props = $props();
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let assets = getOwnedAssets();
  let dateTime = $derived(
    timeZone && asset[0]?.exifInfo?.dateTimeOriginal
      ? fromISODateTime(asset[0]?.exifInfo.dateTimeOriginal, timeZone)
      : fromISODateTimeUTC(asset[0]?.localDateTime),
  );

  const handleChangeDate = async () => {
    const success = await modalManager.show(AssetSelectionChangeDateModal, {
      initialDate: dateTime ?? DateTime.now(),
      assets: assets,
    });
    if (success) {
      clearSelect();
    }
  };
</script>

{#if menuItem}
  <MenuOption text={$t('change_date')} icon={mdiCalendarEditOutline} onClick={handleChangeDate} />
{/if}
