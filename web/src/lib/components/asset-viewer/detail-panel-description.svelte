<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { Textarea, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fromAction } from 'svelte/attachments';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let currentDescription = $derived(asset.exifInfo?.description ?? '');
  let description = $derived(currentDescription);

  const handleFocusOut = async () => {
    if (description === currentDescription) {
      return;
    }
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { description } });
      toastManager.success($t('asset_description_updated'));
    } catch (error) {
      handleError(error, $t('cannot_update_the_description'));
    }
  };
</script>

{#if isOwner}
  <section class="px-4 mt-10">
    <Textarea
      bind:value={description}
      class="max-h-40 outline-none border-b border-gray-500 bg-transparent ring-0 focus:ring-0 resize-none focus:border-b-2 focus:border-immich-primary dark:focus:border-immich-dark-primary dark:bg-transparent"
      rows={1}
      grow
      shape="rectangle"
      onfocusout={handleFocusOut}
      placeholder={$t('add_a_description')}
      data-testid="autogrow-textarea"
      {@attach fromAction(shortcut, () => ({
        shortcut: { key: 'Enter', ctrl: true },
        onShortcut: (e) => e.currentTarget.blur(),
      }))}
    />
  </section>
{:else if description}
  <section class="px-4 mt-6">
    <p class="wrap-break-word whitespace-pre-line w-full text-black dark:text-white text-base">{description}</p>
  </section>
{/if}
