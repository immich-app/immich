import type { ImportOptions } from '$lib/managers/import-manager.svelte';
import { uploadRequest } from '$lib/utils';
import { createAlbum } from '$lib/utils/album-utils';
import type { TakeoutMediaItem } from '$lib/utils/google-takeout-parser';
import {
  Action,
  AssetMediaStatus,
  AssetVisibility,
  checkBulkUpload,
  getBaseUrl,
  updateAsset,
  type AssetMediaResponseDto,
} from '@immich/sdk';

export interface UploadResult {
  assetId: string;
  status: 'imported' | 'duplicate' | 'error';
  error?: string;
}

async function computeSha1(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function uploadTakeoutItem(item: TakeoutMediaItem, options: ImportOptions): Promise<UploadResult> {
  try {
    const deviceAssetId = 'takeout-' + item.file.name + '-' + item.file.lastModified;
    const fileCreatedAt = item.metadata?.dateTaken
      ? item.metadata.dateTaken.toISOString()
      : new Date(item.file.lastModified).toISOString();

    // Duplicate check
    if (options.skipDuplicates && crypto?.subtle) {
      try {
        const checksum = await computeSha1(item.file);
        const {
          results: [checkResult],
        } = await checkBulkUpload({
          assetBulkUploadCheckDto: { assets: [{ id: item.file.name, checksum }] },
        });
        if (checkResult.action === Action.Reject && checkResult.assetId) {
          return { assetId: checkResult.assetId, status: 'duplicate' };
        }
      } catch (error) {
        console.error('Error checking duplicate', error);
      }
    }

    // Build FormData
    const formData = new FormData();
    formData.append('deviceAssetId', deviceAssetId);
    formData.append('deviceId', 'WEB_IMPORT');
    formData.append('fileCreatedAt', fileCreatedAt);
    formData.append('fileModifiedAt', fileCreatedAt);
    formData.append('isFavorite', String(options.importFavorites && item.metadata?.isFavorite === true));
    formData.append('duration', '0:00:00.000000');
    formData.append('assetData', new File([item.file], item.file.name));

    // Upload
    const response = await uploadRequest<AssetMediaResponseDto>({
      url: getBaseUrl() + '/assets',
      data: formData,
    });

    const assetId = response.data.id;

    if (response.data.status === AssetMediaStatus.Duplicate) {
      return { assetId, status: 'duplicate' };
    }

    // Post-upload metadata update
    const updateDto: Record<string, unknown> = {};

    if (item.metadata?.latitude !== undefined && item.metadata?.longitude !== undefined) {
      updateDto.latitude = item.metadata.latitude;
      updateDto.longitude = item.metadata.longitude;
    }

    if (options.importDescriptions && item.metadata?.description) {
      updateDto.description = item.metadata.description;
    }

    if (options.importArchived && item.metadata?.isArchived) {
      updateDto.visibility = AssetVisibility.Archive;
    }

    if (item.metadata?.dateTaken) {
      updateDto.dateTimeOriginal = item.metadata.dateTaken.toISOString();
    }

    if (Object.keys(updateDto).length > 0) {
      await updateAsset({ id: assetId, updateAssetDto: updateDto });
    }

    return { assetId, status: 'imported' };
  } catch (error) {
    return {
      assetId: '',
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function createImportAlbums(
  items: TakeoutMediaItem[],
  assetIdMap: Map<string, string>,
  selectedAlbums: Set<string>,
): Promise<number> {
  // Group items by albumName
  const albumItemsMap = new Map<string, string[]>();
  for (const item of items) {
    if (!item.albumName) {
      continue;
    }
    const assetId = assetIdMap.get(item.path);
    if (!assetId) {
      continue;
    }
    const existing = albumItemsMap.get(item.albumName);
    if (existing) {
      existing.push(assetId);
    } else {
      albumItemsMap.set(item.albumName, [assetId]);
    }
  }

  let created = 0;
  for (const [albumName, assetIds] of albumItemsMap) {
    if (!selectedAlbums.has(albumName)) {
      continue;
    }
    try {
      await createAlbum(albumName, assetIds);
      created++;
    } catch (error) {
      console.error(`Failed to create album "${albumName}":`, error);
    }
  }

  return created;
}
