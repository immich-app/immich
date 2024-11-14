import { AssetEntity } from 'src/entities/asset.entity';

export const getAssetDateTime = (asset: AssetEntity | undefined) => {
  return asset?.exifInfo?.dateTimeOriginal || asset?.fileCreatedAt;
};
