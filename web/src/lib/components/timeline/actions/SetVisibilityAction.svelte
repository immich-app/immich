<script lang="ts">
  import MenuOption from '#lib/components/shared-components/context-menu/MenuOption.svelte';
  import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
  import { updateAssetsMutation } from '#lib/queries/asset.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import type { OnSetVisibility } from '#lib/utils/actions.ts';
  import { AssetVisibility } from '@immich/sdk';
  import { Button, modalManager } from '@immich/ui';
  import { mdiLockOpenVariantOutline, mdiLockOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onVisibilitySet: OnSetVisibility;
    menuItem?: boolean;
    unlock?: boolean;
  }

  let { onVisibilitySet, menuItem = false, unlock = false }: Props = $props();
  let loading = $state(false);

  const setLockedVisibility = async () => {
    const isConfirmed = await modalManager.showDialog({
      title: unlock ? $t('remove_from_locked_folder') : $t('move_to_locked_folder'),
      prompt: unlock ? $t('remove_from_locked_folder_confirmation') : $t('move_to_locked_folder_confirmation'),
      confirmText: $t('move'),
      confirmColor: unlock ? 'danger' : 'primary',
      icon: unlock ? mdiLockOpenVariantOutline : mdiLockOutline,
    });

    if (!isConfirmed) {
      return;
    }

    loading = true;
    const ids = assetMultiSelectManager.assets.map(({ id }) => id);
    await executeMutation(
      () => updateAssetsMutation({ error: { toast: 'errors.unable_to_save_settings' } }),
      [{ assetBulkUpdateDto: { ids, visibility: unlock ? AssetVisibility.Timeline : AssetVisibility.Locked } }],
      { onSuccess: () => onVisibilitySet(ids) },
    );
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption
    onClick={setLockedVisibility}
    text={unlock ? $t('move_off_locked_folder') : $t('move_to_locked_folder')}
    icon={unlock ? mdiLockOpenVariantOutline : mdiLockOutline}
  />
{:else}
  <Button
    leadingIcon={unlock ? mdiLockOpenVariantOutline : mdiLockOutline}
    disabled={loading}
    size="medium"
    color="secondary"
    variant="ghost"
    onclick={setLockedVisibility}
  >
    {unlock ? $t('move_off_locked_folder') : $t('move_to_locked_folder')}
  </Button>
{/if}
