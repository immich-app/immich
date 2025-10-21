import { AssetResponseDto } from "src/dtos/asset-response.dto";


export const getExifCount = (asset: AssetResponseDto) => {
  return Object.values(asset.exifInfo ?? {}).filter(Boolean).length;
};
