import type { AssetResponseDto } from '@immich/sdk';

const sizeOf = (a: AssetResponseDto) => a.exifInfo?.fileSizeInByte ?? 0;
const isExternal = (a: AssetResponseDto) => !!a.libraryId;

export function selectDefaultByCurrentHeuristic(assets: AssetResponseDto[]): AssetResponseDto {
  const best = Math.max(...assets.map(sizeOf));
  return assets.find((a) => sizeOf(a) === best) ?? assets[0];
}

export function applyExternalTieBreaker(
  assets: AssetResponseDto[],
  current: AssetResponseDto,
  enabled: boolean,
): AssetResponseDto {
  if (!enabled) return current;
  const best = Math.max(...assets.map(sizeOf));
  const candidates = assets.filter((a) => sizeOf(a) === best);
  if (candidates.length <= 1) return current;
  const external = candidates.find(isExternal);
  return external ?? current;
}
