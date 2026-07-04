<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/MenuOption.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { type AlbumResponseDto } from '@immich/sdk';
  import AssetRemoveFromAlbumModal from '$lib/modals/AssetRemoveFromAlbumModal.svelte';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiDeleteOutline, mdiImageRemoveOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    album?: AlbumResponseDto;
    onRemove?: (assetIds: string[]) => void;
    menuItem?: boolean;
  }

  let { album, onRemove, menuItem = false }: Props = $props();

  const onAction = async () => {
    const assetIds = assetMultiSelectManager.assets.map(({ id }) => id) ?? [];
    const albumIds = await modalManager.show(AssetRemoveFromAlbumModal, { assetIds });
    if (!album || albumIds.includes(album.id)) onRemove?.(assetIds);
  };
</script>

{#if menuItem}
  <MenuOption text={$t('remove_from_album')} icon={mdiImageRemoveOutline} onClick={onAction} />
{:else}
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    aria-label={$t('remove_from_album')}
    icon={mdiDeleteOutline}
    onclick={onAction}
  />
{/if}
