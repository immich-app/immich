import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import type { SlideshowLook, SlideshowNavigation } from '$lib/stores/slideshow.store';
import { AssetOrderPreference, deleteAssets as deleteBulk, type AssetResponseDto } from '@immich/sdk';
import { handleError } from './handle-error';

export type OnDelete = (assetIds: string[]) => void;
export type OnRestore = (ids: string[]) => void;
export type OnArchive = (ids: string[], isArchived: boolean) => void;
export type OnFavorite = (ids: string[], favorite: boolean) => void;
export type OnStack = (ids: string[]) => void;
export type OnUnstack = (assets: AssetResponseDto[]) => void;

export const deleteAssets = async (force: boolean, onAssetDelete: OnDelete, ids: string[]) => {
  try {
    await deleteBulk({ assetBulkDeleteDto: { ids, force } });
    onAssetDelete(ids);

    notificationController.show({
      message: `${force ? 'Permanently deleted' : 'Trashed'} ${ids.length} assets`,
      type: NotificationType.Info,
    });
  } catch (error) {
    handleError(error, 'Error deleting assets');
  }
};

export type RenderedOption = {
  title: string;
  icon?: string;
  disabled?: boolean;
};

export const handleToggle = <Type extends SlideshowNavigation | SlideshowLook | AssetOrderPreference>(
  record: RenderedOption,
  options: Record<Type, RenderedOption>,
): undefined | Type => {
  for (const [key, option] of Object.entries(options)) {
    if (option === record) {
      return key as Type;
    }
  }
};
