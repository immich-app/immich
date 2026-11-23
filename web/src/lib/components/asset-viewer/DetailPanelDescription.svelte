<script lang="ts">
  import { updateAssetMutation } from '#lib/queries/asset.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import type { AssetResponseDto } from '@immich/sdk';
  import { Textarea, shortcut } from '@immich/ui';
  import { t } from 'svelte-i18n';

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
    await executeMutation(
      () =>
        updateAssetMutation({
          success: { toast: 'asset_description_updated' },
          error: { toast: 'cannot_update_the_description' },
        }),
      [{ id: asset.id, updateAssetDto: { description: description || null } }],
    );
  };
</script>

{#if isOwner}
  <section class="mt-10 px-4">
    <Textarea
      bind:value={description}
      class="max-h-40 resize-none border-b border-gray-500 bg-transparent ps-0 ring-0 outline-none focus:border-b-2 focus:border-immich-primary focus:ring-0 dark:bg-transparent dark:focus:border-immich-dark-primary"
      rows={1}
      grow
      shape="rectangle"
      onfocusout={handleFocusOut}
      placeholder={$t('add_a_description')}
      data-testid="autogrow-textarea"
      {@attach shortcut({
        shortcut: { key: 'Enter', ctrl: true },
        onShortcut: (e) => e.currentTarget.blur(),
      })}
    />
  </section>
{:else if description}
  <section class="mt-6 px-4">
    <p class="w-full text-base wrap-break-word whitespace-pre-line text-black dark:text-white">{description}</p>
  </section>
{/if}
