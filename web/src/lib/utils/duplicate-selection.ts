import type { TiePreference } from '$lib/stores/duplicate-preferences';
import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';

const sizeOf = (a: AssetResponseDto) => a.exifInfo?.fileSizeInByte ?? 0;
const isExternal = (a: AssetResponseDto) => !!a.libraryId;

export function selectDefaultByCurrentHeuristic(assets: AssetResponseDto[]): AssetResponseDto {
  const bestSize = Math.max(...assets.map(sizeOf));
  const sizeCandidates = assets.filter((a) => sizeOf(a) === bestSize);
  if (sizeCandidates.length <= 1) return sizeCandidates[0] ?? assets[0];
  const bestExif = Math.max(...sizeCandidates.map(getExifCount));
  const exifCandidates = sizeCandidates.filter((a) => getExifCount(a) === bestExif);
  return exifCandidates.at(-1) ?? assets[0];
}

export function applyLibraryTieBreaker(
  assets: AssetResponseDto[],
  current: AssetResponseDto,
  preference: TiePreference,
): AssetResponseDto {
  if (preference === 'default') return current;
  const bestSize = Math.max(...assets.map(sizeOf));
  const sizeCandidates = assets.filter((a) => sizeOf(a) === bestSize);
  const bestExif = Math.max(...sizeCandidates.map(getExifCount));
  const candidates = sizeCandidates.filter((a) => getExifCount(a) === bestExif);
  if (candidates.length <= 1) return current;

  if (preference === 'external') {
    const external = candidates.find(isExternal);
    return external ?? current;
  }
  if (preference === 'internal') {
    const internal = candidates.find((a) => !isExternal(a));
    return internal ?? current;
  }
  return current;
}
