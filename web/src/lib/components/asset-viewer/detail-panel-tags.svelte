<script lang="ts">
  import Badge from '$lib/components/elements/badge.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute } from '$lib/constants';
  import { isSharedLink } from '$lib/utils';
  import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
  import { mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { tagAssets } from '$lib/utils/asset-utils';
  import TagAssetForm from '$lib/components/forms/tag-asset-form.svelte';

  export let asset: AssetResponseDto;
  export let isOwner: boolean;

  $: tags = asset.tags || [];

  let isOpen = false;

  const handleAdd = async () => {
    isOpen = true;
  };

  const handleCancel = () => (isOpen = false);

  const handleTag = async (tagIds: string[]) => {
    const ids = await tagAssets({ tagIds, assetIds: [asset.id], showNotification: false });

    if (ids) {
      isOpen = false;
    }

    asset = await getAssetInfo({ id: asset.id });
  };
</script>

{#if isOwner && !isSharedLink()}
  <section class="px-4 mt-4">
    <div class="flex h-10 w-full items-center justify-between text-sm">
      <h2>{$t('tags').toUpperCase()}</h2>
    </div>
    <section class="flex flex-wrap pt-2 gap-1">
      {#each tags as tag (tag.id)}
        <a href={encodeURI(`${AppRoute.TAGS}/?path=${tag.value}`)}>
          <Badge rounded="full"><span class="text-sm px-1" title={tag.value}>{tag.value}</span></Badge>
        </a>
      {/each}
      <button
        class="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 flex place-items-center place-content-center gap-1 px-2 py-1"
        title="Add tag"
        on:click={handleAdd}
      >
        <span class="text-sm px-1 flex place-items-center place-content-center gap-1"><Icon path={mdiPlus} />Add</span>
      </button>
    </section>
  </section>
{/if}

{#if isOpen}
  <TagAssetForm onTag={(tagsIds) => handleTag(tagsIds)} onCancel={handleCancel} />
{/if}
