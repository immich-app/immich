<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { createStack, deleteStack, type AssetResponseDto, type StackResponseDto } from '@immich/sdk';
  import { mdiUploadMultiple } from '@mdi/js';

  interface Props {
    asset: AssetResponseDto;
    stack: StackResponseDto | null;
  }

  let { asset, stack }: Props = $props();

  const handleAddUploadToStack = async () => {
    const newAssetIds = (await openFileUploadDialog({ multiple: true })).filter((id) => id !== undefined);
    // Set the primary asset id to the original stacks primary asset if it exists
    const primaryAssetId = stack?.primaryAssetId ?? asset.id;

    // If the original asset is already in a stack, the stack needs to be
    // deleted and a new stack needs to be created with the original assets
    // and the new assets.
    if (stack) await deleteStack({ id: stack.id });

    // First asset in the list is the primary asset
    // Set ensures that there are no duplicates and preserves order
    const assetIds = new Set([
      primaryAssetId,
      asset.id,
      ...(stack?.assets.map((asset) => asset.id) ?? []),
      ...newAssetIds,
    ]);

    await createStack({
      stackCreateDto: {
        assetIds: [...assetIds],
      },
    });
  };
</script>

<MenuOption icon={mdiUploadMultiple} onClick={handleAddUploadToStack} text={'Add upload to stack'} />
