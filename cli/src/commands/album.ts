import { AlbumResponseDto, BulkIdResponseDto, addAssetsToAlbum, getAlbumInfo, getAllAlbums } from '@immich/sdk';
import { chunk } from 'lodash-es';
import { BaseOptions, authenticate, logError, withError } from 'src/utils';
import { s } from './asset';

export interface AlbumOptions extends BaseOptions {
  batchSize?: number;
  jsonOutput?: boolean;
}

export const listAlbums = async (options: AlbumOptions) => {
  await authenticate(options);
  const [error, albums] = await withError<AlbumResponseDto[]>(getAllAlbums({}));
  if (error) {
    logError(error, 'Failed to list albums');
    process.exit(1);
  }

  if (options.jsonOutput) {
    console.log(JSON.stringify(albums, undefined, 4));
    return;
  }

  for (const album of albums) {
    console.log(`${album.id}\t${album.albumName}`);
  }
};

export const albumInfo = async (albumId: string, options: AlbumOptions) => {
  await authenticate(options);
  const [error, album] = await withError<AlbumResponseDto>(getAlbumInfo({ id: albumId }));
  if (error) {
    logError(error, `Failed to get album info for ${albumId}`);
    process.exit(1);
  }

  if (options.jsonOutput) {
    console.log(JSON.stringify(album, undefined, 4));
    return;
  }

  console.log(`ID: ${album.id}`);
  console.log(`Name: ${album.albumName}`);
  console.log(`Assets: ${album.assetCount}`);
  if (album.assets) {
    for (const asset of album.assets) {
      console.log(`${asset.id}\t${asset.originalFileName}`);
    }
  }
};

export const addAssets = async (albumId: string, assetIds: string[], options: AlbumOptions) => {
  await authenticate(options);
  const results: BulkIdResponseDto[] = [];
  const batchSize = Math.max(1, Number(options.batchSize ?? 1000));

  for (const assetBatch of chunk(assetIds, batchSize)) {
    const [error, result] = await withError(addAssetsToAlbum({ id: albumId, bulkIdsDto: { ids: assetBatch } }));
    if (error) {
      logError(error, `Failed to add assets to album ${albumId}`);
      process.exit(1);
    }

    results.push(...result);
  }

  if (options.jsonOutput) {
    console.log(JSON.stringify(results, undefined, 4));
    return;
  }

  const successCount = results.filter(({ success }) => success).length;
  const duplicateCount = results.filter(({ success, error }) => !success && error === 'duplicate').length;
  const failureCount = results.length - successCount - duplicateCount;

  const suffixParts: string[] = [];
  if (duplicateCount > 0) {
    suffixParts.push(`${duplicateCount} asset${s(duplicateCount)} already in album`);
  }
  if (failureCount > 0) {
    suffixParts.push(`${failureCount} asset${s(failureCount)} failed`);
  }
  const suffix = suffixParts.length > 0 ? ` (${suffixParts.join(', ')})` : '';

  console.log(`Added ${successCount} asset${s(successCount)} to album ${albumId}${suffix}`);
};
