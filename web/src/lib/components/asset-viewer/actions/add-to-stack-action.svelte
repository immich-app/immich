<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { createStack, type AssetResponseDto, type StackResponseDto } from '@immich/sdk';
  import { mdiUploadMultiple } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    asset: AssetResponseDto;
    stack: StackResponseDto | null;
    onAction: OnAction;
  }

  let { asset, stack, onAction }: Props = $props();

  const handleAddUploadToStack = async () => {
    const newAssetIds = await openFileUploadDialog({ multiple: true });
    // Including the old stacks primary asset ID ensures that all assets of the
    // old stack are automatically included in the new stack.
    const primaryAssetId = stack?.primaryAssetId ?? asset.id;

    // First asset in the list will become the new primary asset.
    const assetIds = [primaryAssetId, ...newAssetIds];

    const newStack = await createStack({
      stackCreateDto: {
        assetIds,
      },
    });

    onAction({ type: AssetAction.STACK, stack: newStack });
  };
</script>

<MenuOption icon={mdiUploadMultiple} onClick={handleAddUploadToStack} text={$t('add_upload_to_stack')} />
