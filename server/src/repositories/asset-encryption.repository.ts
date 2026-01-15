import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/schema';
import { AssetEncryptionTable } from 'src/schema/tables/asset-encryption.table';

export type AssetEncryption = {
  id: string;
  assetId: string;
  wrappedDek: string;
  fileIv: string;
  authTag: string;
  algorithm: string;
  vaultVersion: number;
  createdAt: Date;
};

@Injectable()
export class AssetEncryptionRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async getByAssetId(assetId: string): Promise<AssetEncryption | null> {
    const result = await this.db
      .selectFrom('asset_encryption')
      .selectAll()
      .where('assetId', '=', assetId)
      .orderBy('vaultVersion', 'desc')
      .executeTakeFirst();

    return result ? this.mapToAssetEncryption(result) : null;
  }

  async create(data: Insertable<AssetEncryptionTable>): Promise<AssetEncryption> {
    const result = await this.db.insertInto('asset_encryption').values(data).returningAll().executeTakeFirstOrThrow();

    return this.mapToAssetEncryption(result);
  }

  async delete(assetId: string): Promise<void> {
    await this.db.deleteFrom('asset_encryption').where('assetId', '=', assetId).execute();
  }

  async getUnencryptedAssetIds(userId: string, limit: number): Promise<string[]> {
    const results = await this.db
      .selectFrom('asset')
      .leftJoin('asset_encryption', 'asset.id', 'asset_encryption.assetId')
      .select('asset.id')
      .where('asset.ownerId', '=', userId)
      .where('asset_encryption.id', 'is', null)
      .limit(limit)
      .execute();

    return results.map((r) => r.id);
  }

  private mapToAssetEncryption(row: any): AssetEncryption {
    return {
      id: row.id,
      assetId: row.assetId,
      wrappedDek: row.wrappedDek,
      fileIv: row.fileIv,
      authTag: row.authTag,
      algorithm: row.algorithm,
      vaultVersion: row.vaultVersion,
      createdAt: new Date(row.createdAt),
    };
  }
}
