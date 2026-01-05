<script lang="ts">
  import { getAssetThumbnailUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import type { AlbumResponseDto, PersonResponseDto } from '@immich/sdk';
  import { Card, CardBody, IconButton, Text } from '@immich/ui';
  import { mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    item: AlbumResponseDto | PersonResponseDto;
    isAlbum: boolean;
    onRemove: () => void;
  };

  let { item, isAlbum, onRemove }: Props = $props();
</script>

<Card color="secondary">
  <CardBody class="flex items-center gap-3">
    <div class="shrink-0">
      {#if isAlbum && 'albumThumbnailAssetId' in item}
        {#if item.albumThumbnailAssetId}
          <img
            src={getAssetThumbnailUrl(item.albumThumbnailAssetId)}
            alt={item.albumName}
            class="h-12 w-12 rounded-lg object-cover"
          />
        {:else}
          <div class="h-12 w-12 rounded-lg"></div>
        {/if}
      {:else if !isAlbum && 'name' in item}
        <img src={getPeopleThumbnailUrl(item)} alt={item.name} class="h-12 w-12 rounded-full object-cover" />
      {/if}
    </div>
    <div class="min-w-0 flex-1">
      <Text class="font-semibold truncate">
        {isAlbum && 'albumName' in item ? item.albumName : 'name' in item ? item.name : ''}
      </Text>
      {#if isAlbum && 'assetCount' in item}
        <Text size="small" color="muted">
          {$t('items_count', { values: { count: item.assetCount } })}
        </Text>
      {/if}
    </div>

    <IconButton
      type="button"
      onclick={onRemove}
      class="shrink-0"
      shape="round"
      aria-label={$t('remove')}
      icon={mdiClose}
      size="small"
      variant="ghost"
      color="secondary"
    />
  </CardBody>
</Card>
