<script lang="ts">
  import { shiftKey } from '$lib/actions/input';
  import { Category, category, shortcut } from '$lib/actions/shortcut.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { downloadFile } from '$lib/utils/asset-utils';
  import { getAssetInfo } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiDownload } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: TimelineAsset;
    menuItem?: boolean;
  }

  let { asset, menuItem = false }: Props = $props();

  const onDownloadFile = async () => downloadFile(await getAssetInfo({ ...authManager.params, id: asset.id }));
</script>

<svelte:document {@attach shortcut(shiftKey('d'), category(Category.QuickActions, $t('download')), onDownloadFile)} />

{#if !menuItem}
  <IconButton
    color="secondary"
    shape="round"
    variant="ghost"
    icon={mdiDownload}
    aria-label={$t('download')}
    onclick={onDownloadFile}
  />
{:else}
  <MenuOption icon={mdiDownload} text={$t('download')} onClick={onDownloadFile} />
{/if}
