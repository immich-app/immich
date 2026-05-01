import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { AssetType, AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';

export interface AssetTelemetryByType {
  type: AssetType;
  count: number;
  storageBytes: number;
}

export interface UserAssetTelemetryByType extends AssetTelemetryByType {
  userId: string;
}

export interface SearchTelemetryMetrics {
  eligibleAssets: number;
  embeddedAssets: number;
}

export interface AssetStateTelemetryMetrics {
  externalAssets: number;
  trashAssets: number;
}

export interface AssetTelemetryMetrics {
  assetsByType: AssetTelemetryByType[];
  usersByType: UserAssetTelemetryByType[];
  search: SearchTelemetryMetrics;
  state: AssetStateTelemetryMetrics;
}

export interface PersonTelemetryMetrics {
  faces: number;
  people: number;
}

export interface AppMetricsSnapshot {
  asset: AssetTelemetryMetrics;
  person: PersonTelemetryMetrics;
}

@Injectable()
export class AppMetricsRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async getMetrics(): Promise<AppMetricsSnapshot> {
    const [asset, person] = await Promise.all([this.getAssetMetrics(), this.getPersonMetrics()]);
    return { asset, person };
  }

  private async getAssetMetrics(): Promise<AssetTelemetryMetrics> {
    const assetsByType = await this.db
      .selectFrom('asset')
      .leftJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .select(['asset.type'])
      .select((eb) => [
        eb.fn.countAll<number>().as('count'),
        eb.fn.coalesce(eb.fn.sum<number>('asset_exif.fileSizeInByte'), eb.lit(0)).as('storageBytes'),
      ])
      .where('asset.deletedAt', 'is', null)
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .groupBy('asset.type')
      .execute();

    const usersByType = await this.db
      .selectFrom('asset')
      .leftJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .select(['asset.ownerId as userId', 'asset.type'])
      .select((eb) => [
        eb.fn.countAll<number>().as('count'),
        eb.fn.coalesce(eb.fn.sum<number>('asset_exif.fileSizeInByte'), eb.lit(0)).as('storageBytes'),
      ])
      .where('asset.deletedAt', 'is', null)
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .groupBy(['asset.ownerId', 'asset.type'])
      .execute();

    const search = await this.db
      .selectFrom('asset')
      .leftJoin('smart_search', 'smart_search.assetId', 'asset.id')
      .select((eb) => [
        eb.fn.countAll<number>().as('eligibleAssets'),
        eb.fn.count<number>('smart_search.assetId').as('embeddedAssets'),
      ])
      .where('asset.deletedAt', 'is', null)
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .where('asset.type', 'in', [AssetType.Image, AssetType.Video])
      .executeTakeFirstOrThrow();

    const state = await this.db
      .selectFrom('asset')
      .select((eb) => [
        eb.fn.countAll<number>().filterWhere('asset.deletedAt', 'is not', null).as('trashAssets'),
        eb.fn
          .countAll<number>()
          .filterWhere((eb) => eb.and([eb('asset.deletedAt', 'is', null), eb('asset.isExternal', '=', true)]))
          .as('externalAssets'),
      ])
      .executeTakeFirstOrThrow();

    return {
      assetsByType: assetsByType.map((item) => ({
        type: item.type,
        count: Number(item.count),
        storageBytes: Number(item.storageBytes),
      })),
      usersByType: usersByType.map((item) => ({
        userId: item.userId,
        type: item.type,
        count: Number(item.count),
        storageBytes: Number(item.storageBytes),
      })),
      search: {
        eligibleAssets: Number(search.eligibleAssets),
        embeddedAssets: Number(search.embeddedAssets),
      },
      state: {
        externalAssets: Number(state.externalAssets),
        trashAssets: Number(state.trashAssets),
      },
    };
  }

  private async getPersonMetrics(): Promise<PersonTelemetryMetrics> {
    const result = await this.db
      .selectFrom('asset_face')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .select((eb) => [
        eb.fn.countAll<number>().as('faces'),
        eb.fn
          .count<number>('asset_face.personId')
          .distinct()
          .filterWhere('asset_face.personId', 'is not', null)
          .as('people'),
      ])
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .where('asset.deletedAt', 'is', null)
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .executeTakeFirstOrThrow();

    return {
      faces: Number(result.faces),
      people: Number(result.people),
    };
  }
}
