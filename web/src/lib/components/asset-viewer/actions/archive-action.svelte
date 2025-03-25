<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import type { OnAction, PreAction } from '$lib/components/asset-viewer/actions/action';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { toggleArchive } from '$lib/utils/asset-utils';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiArchiveArrowDownOutline, mdiArchiveArrowUpOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
    preAction: PreAction;
  }

  let { asset, onAction, preAction }: Props = $props();

  const onArchive = async () => {
    if (!asset.isArchived) {
      preAction({ type: AssetAction.ARCHIVE, asset });
    }
    const updatedAsset = await toggleArchive(asset);
    if (updatedAsset) {
      onAction({ type: asset.isArchived ? AssetAction.ARCHIVE : AssetAction.UNARCHIVE, asset });
    }
  };
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'a', shift: true }, onShortcut: onArchive }} />

<MenuOption
  icon={asset.isArchived ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline}
  text={asset.isArchived ? $t('unarchive') : $t('to_archive')}
  onClick={onArchive}
/>
