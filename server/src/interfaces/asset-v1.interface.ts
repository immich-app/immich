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
  getAssetsByChecksums(userId: string, checksums: Buffer[]): Promise<AssetCheck[]>;
}

export const IAssetRepositoryV1 = 'IAssetRepositoryV1';
