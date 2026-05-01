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

  let description = $derived(asset.exifInfo?.description ?? '');

  const handleFocusOut = async () => {
    const currentDescription = asset.exifInfo?.description ?? '';
    if (description === currentDescription) {
      return;
    }
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { description } });
      toastManager.primary($t('asset_description_updated'));
    } catch (error) {
      handleError(error, $t('cannot_update_the_description'));
    }
  };
</script>

{#if isOwner}
  <section class="mt-10 px-4">
    <Textarea
      bind:value={description}
      class="max-h-40 resize-none border-b border-gray-500 bg-transparent pl-0 ring-0 outline-none focus:border-b-2 focus:border-immich-primary focus:ring-0 dark:bg-transparent dark:focus:border-immich-dark-primary"
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
  <section class="mt-6 px-4">
    <p class="w-full text-base wrap-break-word whitespace-pre-line text-black dark:text-white">{description}</p>
  </section>
{/if}
