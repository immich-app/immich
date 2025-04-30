<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import TagAssetForm from '$lib/components/forms/tag-asset-form.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { AppRoute } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { removeTag, tagAssets } from '$lib/utils/asset-utils';
  import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
  import { mdiClose, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset = $bindable(), isOwner }: Props = $props();

  let tags = $derived(asset.tags || []);

  let isOpen = $state(false);

  const handleAdd = () => (isOpen = true);

  const handleCancel = () => (isOpen = false);

  const handleTag = async (tagIds: string[]) => {
    const ids = await tagAssets({ tagIds, assetIds: [asset.id], showNotification: false });
    if (ids) {
      isOpen = false;
    }

    asset = await getAssetInfo({ id: asset.id });
  };

  const handleRemove = async (tagId: string) => {
    const ids = await removeTag({ tagIds: [tagId], assetIds: [asset.id], showNotification: false });
    if (ids) {
      asset = await getAssetInfo({ id: asset.id });
    }
  };
</script>

{#if isOwner && !authManager.key}
  <section class="px-4 mt-4">
    <div class="flex h-10 w-full items-center justify-between text-sm">
      <h2>{$t('tags').toUpperCase()}</h2>
    </div>
    <section class="flex flex-wrap pt-2 gap-1" data-testid="detail-panel-tags">
      {#each tags as tag (tag.id)}
        <div class="flex group transition-all">
          <a
            class="inline-block h-min whitespace-nowrap ps-3 pe-1 group-hover:ps-3 py-1 text-center align-baseline leading-none text-gray-100 dark:text-immich-dark-gray bg-immich-primary dark:bg-immich-dark-primary roudned-s-full hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
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
            <Icon path={mdiClose} />
          </button>
        </div>
      {/each}
      <button
        type="button"
        class="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 flex place-items-center place-content-center gap-1 px-2 py-1"
        title="Add tag"
        onclick={handleAdd}
      >
        <span class="text-sm px-1 flex place-items-center place-content-center gap-1"><Icon path={mdiPlus} />Add</span>
      </button>
    </section>
  </section>
{/if}

{#if isOpen}
  <Portal>
    <TagAssetForm onTag={(tagsIds) => handleTag(tagsIds)} onCancel={handleCancel} />
  </Portal>
{/if}
