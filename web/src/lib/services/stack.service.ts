import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { executeMutation, queryClient } from '#lib/queries/client.ts';
import {
  createStackMutation,
  deleteStacksMutation,
  getStackQuery,
  removeAssetFromStackMutation,
  updateStackMutation,
} from '#lib/queries/stack.query.ts';
import { openFileUploadDialog } from '#lib/utils/file-uploader.ts';
import { handleError } from '#lib/utils/handle-error.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { navigate } from '#lib/utils/navigation.ts';
import { deleteAssets, type AssetResponseDto, type AssetStackResponseDto, type StackResponseDto } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import {
  mdiImageCheckOutline,
  mdiImageMinusOutline,
  mdiImageMultipleOutline,
  mdiImageOffOutline,
  mdiPinOutline,
  mdiUploadMultiple,
} from '@mdi/js';
import { type MessageFormatter } from 'svelte-i18n';

export const getStackBulkActions = ($t: MessageFormatter) => {
  const Stack: ActionItem = {
    title: $t('stack'),
    icon: mdiImageMultipleOutline,
    $if: () => assetMultiSelectManager.ownedAssets.length > 1,
    onAction: () => handleStack(assetMultiSelectManager.ownedAssets.map((asset) => asset.id)),
  };

  const Unstack: ActionItem = {
    title: $t('unstack'),
    icon: mdiImageOffOutline,
    $if: () => assetMultiSelectManager.ownedAssets.every((asset) => !!asset.stack),
    onAction: () => handleDeleteStacks(assetMultiSelectManager.ownedAssets.map(({ stack }) => stack!)),
  };

  return { Stack, Unstack };
};

export const getStackActions = ($t: MessageFormatter, stack: StackResponseDto | undefined, asset: AssetResponseDto) => {
  const authUser = authManager.authenticated ? authManager.user : undefined;
  const isAssetOwner = !!(authUser && authUser.id === asset.ownerId);
  const validStack = !!stack && isAssetOwner;

  const AddUploads: ActionItem = {
    title: $t('add_upload_to_stack', { values: { isStack: !!stack } }),
    icon: mdiUploadMultiple,
    $if: () => isAssetOwner,
    onAction: () => handleAddUploadToStack(stack, asset),
  };

  const KeepThisDeleteOthers: ActionItem = {
    title: $t('keep_this_delete_others'),
    icon: mdiPinOutline,
    $if: () => validStack,
    onAction: () => handleKeepThisDeleteOthers(stack!, asset),
  };

  const RemoveAsset: ActionItem = {
    title: $t('viewer_remove_from_stack'),
    icon: mdiImageMinusOutline,
    $if: () => validStack && stack?.primaryAssetId !== asset.id && stack?.assets?.length > 2,
    onAction: () => handleRemoveFromStack(stack!, asset),
  };

  const SetPrimaryAsset: ActionItem = {
    title: $t('set_stack_primary_asset'),
    icon: mdiImageCheckOutline,
    $if: () => validStack && stack!.primaryAssetId !== asset.id,
    onAction: () => handleSetPrimaryAsset(stack!, asset),
  };

  const Unstack: ActionItem = {
    title: $t('unstack'),
    icon: mdiImageOffOutline,
    $if: () => validStack,
    onAction: () => handleDeleteStack(stack!),
  };

  return { AddUploads, KeepThisDeleteOthers, RemoveAsset, SetPrimaryAsset, Unstack };
};

const handleAddUploadToStack = async (stack: StackResponseDto | undefined, asset: AssetResponseDto) => {
  const $t = await getFormatter();

  const newAssetIds = await openFileUploadDialog({ multiple: true });
  const primaryAssetId = stack?.primaryAssetId ?? asset.id;
  const assetIds = [primaryAssetId, ...newAssetIds];

  await executeMutation(createStackMutation, [{ stackCreateDto: { assetIds } }], {
    onSuccess: ({ id, primaryAssetId, assets }) => {
      toastManager.primary($t('stack_created'));
      eventManager.emit('AssetUpdate', { ...asset, stack: { id, primaryAssetId, assetCount: assets.length } });
    },
  });
};

const handleKeepThisDeleteOthers = async (stack: StackResponseDto, asset: AssetResponseDto) => {
  const $t = await getFormatter();

  const isConfirmed = await modalManager.showDialog({
    title: $t('keep_this_delete_others'),
    prompt: $t('confirm_keep_this_delete_others'),
    confirmText: $t('delete_others'),
  });

  if (!isConfirmed) {
    return;
  }

  const assetsToDeleteIds = stack.assets.filter((a) => a.id !== asset.id).map((asset) => asset.id);
  try {
    await deleteAssets({ assetBulkDeleteDto: { ids: assetsToDeleteIds } });
  } catch (error) {
    handleError(error, $t('errors.failed_to_keep_this_delete_others'));
    return;
  }

  await executeMutation(
    () => deleteStacksMutation({ error: { toast: 'errors.failed_to_keep_this_delete_others' } }),
    [{ bulkIdsDto: { ids: [stack.id] } }],
    {
      onSuccess: () => {
        toastManager.primary($t('kept_this_deleted_others', { values: { count: assetsToDeleteIds.length } }));
        eventManager.emit('StackDelete', { id: stack.id, assets: [asset] });
        eventManager.emit('AssetUpdate', { ...asset, stack: null });
      },
    },
  );
};

const handleRemoveFromStack = (stack: StackResponseDto, asset: AssetResponseDto) =>
  executeMutation(removeAssetFromStackMutation, [{ id: stack.id, assetId: asset.id }], {
    onSuccess: () => {
      eventManager.emit('AssetUpdate', asset);
      eventManager.emit('StackUpdate', { ...stack, assets: stack.assets.filter((a) => a.id !== asset.id) });
    },
  });

const handleSetPrimaryAsset = (stack: StackResponseDto, asset: AssetResponseDto) =>
  executeMutation(updateStackMutation, [{ id: stack.id, stackUpdateDto: { primaryAssetId: asset.id } }]);

export const handleStack = async (assetIds: string[]) => {
  const $t = await getFormatter();

  await executeMutation(createStackMutation, [{ stackCreateDto: { assetIds } }], {
    onSuccess: (stack) => {
      toastManager.primary({
        description: $t('stacked_assets_count', { values: { count: stack.assets.length } }),
        button: {
          label: $t('view_stack'),
          onclick: () => navigate({ targetRoute: 'current', assetId: stack.primaryAssetId }),
        },
      });
      assetMultiSelectManager.clear();
    },
  });
};

export const handleDeleteStack = async (stack: StackResponseDto) => {
  const $t = await getFormatter();

  await executeMutation(deleteStacksMutation, [{ bulkIdsDto: { ids: [stack.id] } }], {
    onSuccess: () => {
      toastManager.primary($t('unstacked_assets_count', { values: { count: stack.assets.length } }));
      eventManager.emit('StackDelete', stack);
    },
  });
};

const handleDeleteStacks = async (assetStacks: AssetStackResponseDto[]) => {
  const $t = await getFormatter();

  try {
    const stacks = await Promise.all(assetStacks.map(({ id }) => queryClient.query(getStackQuery(id))));
    await Promise.all(stacks.map((stack) => handleDeleteStack(stack)));
  } catch (error) {
    handleError(error, $t('errors.failed_to_unstack_assets'));
  }
  assetMultiSelectManager.clear();
};
