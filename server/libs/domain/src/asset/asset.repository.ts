import { AssetEntity } from '@app/infra/db/entities';
import { AssetSearchDto } from './dto/asset-search.dto';
import { CheckExistingAssetsDto } from './dto/check-existing-assets.dto';
import { GetAssetByTimeBucketDto } from './dto/get-asset-by-time-bucket.dto';
import { TimeGroupEnum } from './dto/get-asset-count-by-time-bucket.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetCountByTimeBucket } from './response-dto/asset-count-by-time-group-response.dto';
import { AssetCountByUserIdResponseDto } from './response-dto/asset-count-by-user-id-response.dto';
import { CheckExistingAssetsResponseDto } from './response-dto/check-existing-assets-response.dto';
import { CuratedLocationsResponseDto } from './response-dto/curated-locations-response.dto';
import { CuratedObjectsResponseDto } from './response-dto/curated-objects-response.dto';

export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  get(id: string): Promise<AssetEntity | null>;
  create(asset: Omit<AssetEntity, 'id'>): Promise<AssetEntity>;
  remove(asset: AssetEntity): Promise<void>;
  save(asset: AssetEntity): Promise<AssetEntity>;

  update(userId: string, asset: AssetEntity, dto: UpdateAssetDto): Promise<AssetEntity>;
  getAll(): Promise<AssetEntity[]>;
  getAllVideos(): Promise<AssetEntity[]>;
  getAllByUserId(userId: string, dto: AssetSearchDto): Promise<AssetEntity[]>;
  getAllByDeviceId(userId: string, deviceId: string): Promise<string[]>;
  getById(assetId: string): Promise<AssetEntity>;
  getLocationsByUserId(userId: string): Promise<CuratedLocationsResponseDto[]>;
  getDetectedObjectsByUserId(userId: string): Promise<CuratedObjectsResponseDto[]>;
  getSearchPropertiesByUserId(userId: string): Promise<SearchPropertiesDto[]>;
  getAssetCountByTimeBucket(userId: string, timeBucket: TimeGroupEnum): Promise<AssetCountByTimeBucket[]>;
  getAssetCountByUserId(userId: string): Promise<AssetCountByUserIdResponseDto>;
  getAssetByTimeBucket(userId: string, getAssetByTimeBucketDto: GetAssetByTimeBucketDto): Promise<AssetEntity[]>;
  getAssetByChecksum(userId: string, checksum: Buffer): Promise<AssetEntity>;
  getAssetWithNoThumbnail(): Promise<AssetEntity[]>;
  getAssetWithNoEncodedVideo(): Promise<AssetEntity[]>;
  getAssetWithNoEXIF(): Promise<AssetEntity[]>;
  getAssetWithNoSmartInfo(): Promise<AssetEntity[]>;
  getExistingAssets(
    userId: string,
    checkDuplicateAssetDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto>;
  countByIdAndUser(assetId: string, userId: string): Promise<number>;
  searchAsset(userId: string, term: string): Promise<AssetEntity[]>;
  checkExistingAsset(userId: string, deviceId: string, deviceAssetId: string): Promise<AssetEntity | null>;
}
