<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import AssetSelectionChangeDateModal from '$lib/modals/AssetSelectionChangeDateModal.svelte';
  import { fromTimelinePlainDateTime } from '$lib/utils/timeline-util';
  import { modalManager } from '@immich/ui';
  import { mdiCalendarEditOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    menuItem?: boolean;
  };

  let { menuItem = false }: Props = $props();

  const handleChangeDate = async () => {
    const assets = assetMultiSelectManager.ownedAssets;
    const initialDate = assets.length === 1 ? fromTimelinePlainDateTime(assets[0].localDateTime) : DateTime.now();
    const success = await modalManager.show(AssetSelectionChangeDateModal, {
      initialDate,
      assets,
    });
    if (success) {
      assetMultiSelectManager.clear();
    }
  };
</script>

{#if menuItem}
  <MenuOption text={$t('change_date')} icon={mdiCalendarEditOutline} onClick={handleChangeDate} />
{/if}
