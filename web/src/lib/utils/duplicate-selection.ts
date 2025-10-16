import type { TiePreference } from '$lib/stores/duplicate-preferences';
import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';

const sizeOf = (assets: AssetResponseDto) => assets.exifInfo?.fileSizeInByte ?? 0;
const isExternal = (assets: AssetResponseDto) => !!assets.libraryId;

export function selectDefaultByCurrentHeuristic(assets: AssetResponseDto[]): AssetResponseDto {
  const bestSize = Math.max(...assets.map(
    (assets) => sizeOf(assets))
  );
  const sizeCandidates = assets.filter(
    (assets) => sizeOf(assets) === bestSize,
  );

  if (sizeCandidates.length <= 1) {
    return sizeCandidates[0] ?? assets[0];
  }

  const bestExif = Math.max(...sizeCandidates.map(
    (assets)=> getExifCount(assets))
  );
  const exifCandidates = sizeCandidates.filter(
    (assets) => getExifCount(assets) === bestExif
  );

  return exifCandidates.at(-1) ?? assets[0];
}

export function applyLibraryTieBreaker(
  assets: AssetResponseDto[],
  current: AssetResponseDto,
  preference: TiePreference,
): AssetResponseDto {
  if (preference === 'default'){
    return current;
  }

  const bestSize = Math.max(...assets.map(
    (assets) => sizeOf(assets))
  );
  const sizeCandidates = assets.filter(
    (assets) => sizeOf(assets) === bestSize
  );
  const bestExif = Math.max(...sizeCandidates.map(getExifCount));
  const candidates = sizeCandidates.filter(
    (assets) => getExifCount(assets) === bestExif
  );

  if (candidates.length <= 1){
    return current;
  }

  if (preference === 'external') {
    const external = candidates.find(isExternal);
    return external ?? current;
  }

  if (preference === 'internal') {
    const internal = candidates.find(
      (assets) => !isExternal(assets));
    return internal ?? current;
  }

  return current;
}
