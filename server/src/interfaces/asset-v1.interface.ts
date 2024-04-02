import { CuratedLocationsResponseDto, CuratedObjectsResponseDto } from 'src/dtos/asset-v1-response.dto';
import { AssetSearchDto, CheckExistingAssetsDto, SearchPropertiesDto } from 'src/dtos/asset-v1.dto';
import { AssetEntity } from 'src/entities/asset.entity';

export interface AssetCheck {
  id: string;
  checksum: Buffer;
}

export interface AssetOwnerCheck extends AssetCheck {
  ownerId: string;
}

export interface IAssetRepositoryV1 {
  get(id: string): Promise<AssetEntity | null>;
  getLocationsByUserId(userId: string): Promise<CuratedLocationsResponseDto[]>;
  getDetectedObjectsByUserId(userId: string): Promise<CuratedObjectsResponseDto[]>;
  getAllByUserId(userId: string, dto: AssetSearchDto): Promise<AssetEntity[]>;
  getSearchPropertiesByUserId(userId: string): Promise<SearchPropertiesDto[]>;
  getAssetsByChecksums(userId: string, checksums: Buffer[]): Promise<AssetCheck[]>;
  getExistingAssets(userId: string, checkDuplicateAssetDto: CheckExistingAssetsDto): Promise<string[]>;
  getByOriginalPath(originalPath: string): Promise<AssetOwnerCheck | null>;
}

export const IAssetRepositoryV1 = 'IAssetRepositoryV1';
