<script lang="ts">
  import AutogrowTextarea from '$lib/components/shared-components/autogrow-textarea.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let description = $derived(asset.exifInfo?.description || '');

  const handleFocusOut = async (newDescription: string) => {
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { description: newDescription } });

      asset.exifInfo = { ...asset.exifInfo, description: newDescription };

      toastManager.success($t('asset_description_updated'));
    } catch (error) {
      handleError(error, $t('cannot_update_the_description'));
    }
  };
</script>

{#if isOwner}
  <section class="px-4 mt-10">
    <AutogrowTextarea
      content={description}
      class="max-h-125 w-full border-b border-gray-500 bg-transparent text-base text-black outline-none transition-all focus:border-b-2 focus:border-immich-primary disabled:border-none dark:text-white dark:focus:border-immich-dark-primary immich-scrollbar"
      onContentUpdate={handleFocusOut}
      placeholder={$t('add_a_description')}
    />
  </section>
{:else if description}
  <section class="px-4 mt-6">
    <p class="wrap-break-word whitespace-pre-line w-full text-black dark:text-white text-base">{description}</p>
  </section>
{/if}
