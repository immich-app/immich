<script lang="ts">
  import type { OnAction, PreAction } from '#lib/components/asset-viewer/actions/action.ts';
  import MenuOption from '#lib/components/shared-components/context-menu/MenuOption.svelte';
  import { AssetAction } from '#lib/constants.ts';
  import { toggleArchive } from '#lib/utils/asset-utils.ts';
  import { toTimelineAsset } from '#lib/utils/timeline-util.ts';
  import type { AssetResponseDto } from '@immich/sdk';
  import { shortcut } from '@immich/ui';
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
      preAction({ type: AssetAction.ARCHIVE, asset: toTimelineAsset(asset) });
    }
    const updatedAsset = await toggleArchive(asset);
    if (updatedAsset) {
      onAction({ type: asset.isArchived ? AssetAction.ARCHIVE : AssetAction.UNARCHIVE, asset: toTimelineAsset(asset) });
    }
  };
</script>

<svelte:window {@attach shortcut({ shortcut: { key: 'a', shift: true }, onShortcut: onArchive })} />

<MenuOption
  icon={asset.isArchived ? mdiArchiveArrowUpOutline : mdiArchiveArrowDownOutline}
  text={asset.isArchived ? $t('unarchive') : $t('to_archive')}
  onClick={onArchive}
/>
