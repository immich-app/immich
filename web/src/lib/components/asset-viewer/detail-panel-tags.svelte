<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { Route } from '$lib/route';
  import { getAssetActions } from '$lib/services/asset.service';
  import { removeTag } from '$lib/utils/asset-utils';
  import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
  import { Badge, IconButton, Link, Text } from '@immich/ui';
  import { mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset = $bindable(), isOwner }: Props = $props();

  let tags = $derived(asset.tags || []);

  const handleRemove = async (tagId: string) => {
    const ids = await removeTag({ tagIds: [tagId], assetIds: [asset.id], showNotification: false });
    if (ids) {
      asset = await getAssetInfo({ id: asset.id });
    }
  };

  const onAssetsTag = async (ids: string[]) => {
    if (ids.includes(asset.id)) {
      asset = await getAssetInfo({ id: asset.id });
    }
  };

  const { Tag } = $derived(getAssetActions($t, asset));
</script>

<OnEvents {onAssetsTag} />

{#if isOwner && !authManager.isSharedLink}
  <section class="px-4 mt-4">
    <div class="flex h-10 w-full items-center justify-between text-sm">
      <Text color="muted">{$t('tags')}</Text>
    </div>
    <section class="flex flex-wrap pt-2 gap-1" data-testid="detail-panel-tags">
      {#each tags as tag (tag.id)}
        <Badge size="small" class="items-center px-0" shape="round">
          <Link
            href={Route.tags({ path: tag.value })}
            class="text-light no-underline rounded-full hover:bg-primary-400 px-2"
          >
            {tag.value}
          </Link>
          <IconButton
            aria-label={$t('remove_tag')}
            icon={mdiClose}
            onclick={() => handleRemove(tag.id)}
            size="tiny"
            class="hover:bg-primary-400"
            shape="round"
          />
        </Badge>
      {/each}
      <HeaderActionButton action={Tag} />
    </section>
  </section>
{/if}
