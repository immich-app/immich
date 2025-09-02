<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { createStack, deleteStack, type AssetResponseDto, type StackResponseDto } from '@immich/sdk';
  import { mdiUploadMultiple } from '@mdi/js';
  import type { OnAction } from './action';
  import { AssetAction } from '$lib/constants';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    stack: StackResponseDto | null;
    onAction: OnAction;
  }

  let { asset, stack, onAction }: Props = $props();

  const handleAddUploadToStack = async () => {
    const newAssetIds = await openFileUploadDialog({ multiple: true });
    const primaryAssetId = stack?.primaryAssetId ?? asset.id;

    // If the original asset is already in a stack, the stack needs to be
    // deleted and a new stack needs to be created with the original assets
    // and the new assets because updating the stack is not supported.
    if (stack) {
      await deleteStack({ id: stack.id });
    }

    // First asset in the list will become the new primary asset.
    const assetIds = [
      primaryAssetId,
      ...(stack?.assets.map((asset) => asset.id).filter((id) => id !== primaryAssetId) ?? []),
      ...newAssetIds,
    ];

    const newStack = await createStack({
      stackCreateDto: {
        assetIds,
      },
    });

    onAction({ type: AssetAction.STACK, stack: newStack });
  };
</script>

<MenuOption icon={mdiUploadMultiple} onClick={handleAddUploadToStack} text={$t('add_upload_to_stack')} />
