<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { AppRoute } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import AssetTagModal from '$lib/modals/AssetTagModal.svelte';
  import { removeTag } from '$lib/utils/asset-utils';
  import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
  import { Icon, modalManager } from '@immich/ui';
  import { mdiClose, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset = $bindable(), isOwner }: Props = $props();

  let tags = $derived(asset.tags || []);

  const handleAddTag = async () => {
    const success = await modalManager.show(AssetTagModal, { assetIds: [asset.id] });
    if (success) {
      asset = await getAssetInfo({ id: asset.id });
    }
  };

  const handleRemove = async (tagId: string) => {
    const ids = await removeTag({ tagIds: [tagId], assetIds: [asset.id], showNotification: false });
    if (ids) {
      asset = await getAssetInfo({ id: asset.id });
    }
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 't' }, onShortcut: handleAddTag }} />

{#if isOwner && !authManager.isSharedLink}
  <section class="px-4 mt-4">
    <div class="flex h-10 w-full items-center justify-between text-sm">
      <h2 class="uppercase">{$t('tags')}</h2>
    </div>
    <section class="flex flex-wrap pt-2 gap-1" data-testid="detail-panel-tags">
      {#each tags as tag (tag.id)}
        <div class="flex group transition-all">
          <a
            class="inline-block h-min whitespace-nowrap ps-3 pe-1 group-hover:ps-3 py-1 text-center align-baseline leading-none text-gray-100 dark:text-immich-dark-gray bg-primary rounded-s-full hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
            href={encodeURI(`${AppRoute.TAGS}/?path=${tag.value}`)}
          >
            <p class="text-sm">
              {tag.value}
            </p>
          </a>

          <button
            type="button"
            class="text-gray-100 dark:text-immich-dark-gray bg-immich-primary/95 dark:bg-immich-dark-primary/95 rounded-e-full place-items-center place-content-center pe-2 ps-1 py-1 hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
            title="Remove tag"
            onclick={() => handleRemove(tag.id)}
          >
            <Icon icon={mdiClose} />
          </button>
        </div>
      {/each}
      <button
        type="button"
        class="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 flex place-items-center place-content-center gap-1 px-2 py-1"
        title={$t('add_tag')}
        onclick={handleAddTag}
      >
        <span class="text-sm px-1 flex place-items-center place-content-center gap-1"
          ><Icon icon={mdiPlus} />{$t('add')}</span
        >
      </button>
    </section>
  </section>
{/if}
