import type { AssetResponseDto } from '@immich/sdk';

export const getExifCount = (asset: AssetResponseDto) => {
  return Object.values(asset.exifInfo ?? {}).filter(Boolean).length;
};
