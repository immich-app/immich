<script lang="ts">
  import HeaderActionButton from '#lib/components/HeaderActionButton.svelte';
  import OnEvents from '#lib/components/OnEvents.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { executeMutation, queryClient } from '#lib/queries/client.ts';
  import { getAllTagsQuery, untagAssetsMutation } from '#lib/queries/tag.query.ts';
  import { Route } from '#lib/route.ts';
  import { getAssetActions } from '#lib/services/asset.service.ts';
  import { publicTags } from '#lib/utils/tree-utils.ts';
  import { getAssetInfo, type AssetResponseDto, type TagResponseDto } from '@immich/sdk';
  import { Badge, Link, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset = $bindable(), isOwner }: Props = $props();

  let tags = $derived(asset.tags || []);

  const handleRemove = async (tag: TagResponseDto) => {
    const hierarchy = await queryClient.fetchQuery(getAllTagsQuery());
    const isPrivate = publicTags([...hierarchy, ...tags]).every(({ id }) => id !== tag.id);
    await executeMutation(untagAssetsMutation, [{ id: tag.id, bulkIdsDto: { ids: [asset.id] } }], {
      confirm: isPrivate
        ? {
            title: $t('remove_tag'),
            prompt: $t('remove_private_tag_confirmation'),
            confirmText: $t('remove'),
          }
        : undefined,
      onSuccess: () => void getAssetInfo({ id: asset.id }).then((updated) => (asset = updated)),
    });
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
  <section class="mt-4 px-4">
    <div class="flex h-10 w-full items-center justify-between text-sm">
      <Text color="muted">{$t('tags')}</Text>
    </div>
    <section class="flex flex-wrap gap-1 pt-2" data-testid="detail-panel-tags">
      {#each tags as tag (tag.id)}
        <Badge onClose={() => handleRemove(tag)} size="small" shape="round" translations={{ close: $t('remove_tag') }}>
          <Link href={Route.tags({ path: tag.value })} underline={false} class="px-2 font-light">
            {tag.value}
          </Link>
        </Badge>
      {/each}
      <HeaderActionButton action={Tag} />
    </section>
  </section>
{/if}
