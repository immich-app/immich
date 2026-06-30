import {
  createStack,
  deleteAssets,
  deleteStacks,
  getStack,
  removeAssetFromStack,
  updateStack,
  type AssetResponseDto,
  type AssetStackResponseDto,
  type StackResponseDto,
} from '@immich/sdk';
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
import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { openFileUploadDialog } from '$lib/utils/file-uploader';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { navigate } from '$lib/utils/navigation';

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
  // Including the old stack's primary asset ID ensures that all assets of the
  // old stack are automatically included in the new stack.
  const primaryAssetId = stack?.primaryAssetId ?? asset.id;

  // First asset in the list will become the new primary asset.
  const assetIds = [primaryAssetId, ...newAssetIds];

  try {
    const stack = await createStack({ stackCreateDto: { assetIds } });

    toastManager.primary($t('stack_created'));
    eventManager.emit('StackCreate', stack);
  } catch (error) {
    handleError(error, $t('errors.failed_to_stack_assets'));
  }
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

  try {
    const assetsToDeleteIds = stack.assets.filter((a) => a.id !== asset.id).map((asset) => asset.id);
    await deleteAssets({ assetBulkDeleteDto: { ids: assetsToDeleteIds } });
    await deleteStacks({ bulkIdsDto: { ids: [stack.id] } });

    toastManager.primary($t('kept_this_deleted_others', { values: { count: assetsToDeleteIds.length } }));
    eventManager.emit('StackDelete', { id: stack.id, assets: [asset] });
    eventManager.emit('AssetUpdate', { ...asset, stack: null });
  } catch (error) {
    handleError(error, $t('errors.failed_to_keep_this_delete_others'));
  }
};

const handleRemoveFromStack = async (stack: StackResponseDto, asset: AssetResponseDto) => {
  const $t = await getFormatter();

  try {
    await removeAssetFromStack({ id: stack.id, assetId: asset.id });
    const updatedStack = {
      ...stack,
      assets: stack.assets.filter((a) => a.id !== asset.id),
    };

    toastManager.primary($t('removed_from_stack'));
    eventManager.emit('AssetUpdate', asset); // todo: check if this re-inserts into timeline
    eventManager.emit('StackUpdate', updatedStack);
  } catch (error) {
    handleError(error, $t('errors.failed_to_unstack_assets'));
  }
};

const handleSetPrimaryAsset = async (stack: StackResponseDto, asset: AssetResponseDto) => {
  const $t = await getFormatter();

  try {
    const updatedStack = await updateStack({ id: stack.id, stackUpdateDto: { primaryAssetId: asset.id } });

    // todo: toast?
    eventManager.emit('StackUpdate', updatedStack);
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};

export const handleStack = async (assetIds: string[]) => {
  const $t = await getFormatter();

  try {
    const stack = await createStack({ stackCreateDto: { assetIds } });

    toastManager.primary({
      description: $t('stacked_assets_count', { values: { count: stack.assets.length } }),
      button: {
        label: $t('view_stack'),
        onclick: () => navigate({ targetRoute: 'current', assetId: stack.primaryAssetId }),
      },
    });
    eventManager.emit('StackCreate', stack);
    assetMultiSelectManager.clear();
  } catch (error) {
    handleError(error, $t('errors.failed_to_stack_assets'));
  }
};

export const handleDeleteStack = async (stack: StackResponseDto) => {
  const $t = await getFormatter();

  try {
    await deleteStacks({ bulkIdsDto: { ids: [stack.id] } });

    const assetIds = stack.assets.map((asset) => asset.id);

    toastManager.primary($t('unstacked_assets_count', { values: { count: assetIds.length } }));
    eventManager.emit('StackDelete', stack);

    return assetIds;
  } catch (error) {
    handleError(error, $t('errors.failed_to_unstack_assets'));
  }
};

const handleDeleteStacks = async (assetStacks: AssetStackResponseDto[]) => {
  const $t = await getFormatter();

  try {
    const stacks = await Promise.all(assetStacks.map((stack) => getStack(stack)));
    await Promise.all(stacks.map((stack) => handleDeleteStack(stack)));
  } catch (error) {
    handleError(error, $t('errors.failed_to_unstack_assets'));
  }
  assetMultiSelectManager.clear();
};
