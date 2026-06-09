import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';

const TOP_PEOPLE_LIMIT = 6;
const TOP_RESULTS_LIMIT = 5;

@Injectable()
export class StatisticsRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getMonthlyCounts(userId: string) {
    const year = sql<number>`extract(year from ${sql.ref('asset.fileCreatedAt')})::int`;
    const month = sql<number>`extract(month from ${sql.ref('asset.fileCreatedAt')})::int`;

    return this.db
      .selectFrom('asset')
      .select([year.as('year'), month.as('month')])
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('asset.ownerId', '=', userId)
      .where('asset.deletedAt', 'is', null)
      .groupBy([year, month])
      .orderBy('year', 'asc')
      .orderBy('month', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getTemporalMatrix(userId: string) {
    const dayOfWeek = sql<number>`extract(dow from ${sql.ref('asset.fileCreatedAt')})::int`;
    const hour = sql<number>`extract(hour from ${sql.ref('asset.fileCreatedAt')})::int`;

    return this.db
      .selectFrom('asset')
      .select([dayOfWeek.as('dayOfWeek'), hour.as('hour')])
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('asset.ownerId', '=', userId)
      .where('asset.deletedAt', 'is', null)
      .groupBy([dayOfWeek, hour])
      .orderBy('dayOfWeek', 'asc')
      .orderBy('hour', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getTopPeople(userId: string) {
    return this.db
      .selectFrom('person')
      .innerJoin('asset_face', 'asset_face.personId', 'person.id')
      .innerJoin('asset', (join) =>
        join
          .onRef('asset.id', '=', 'asset_face.assetId')
          .on('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
          .on('asset.deletedAt', 'is', null),
      )
      .selectAll('person')
      .select((eb) => eb.fn.count('asset.id').distinct().as('count'))
      .where('person.ownerId', '=', userId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .groupBy('person.id')
      .orderBy('count', 'desc')
      .limit(TOP_PEOPLE_LIMIT)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getTopCameras(userId: string) {
    return this.db
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .select(['asset_exif.make', 'asset_exif.model'])
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('asset.ownerId', '=', userId)
      .where('asset.deletedAt', 'is', null)
      .where('asset_exif.make', 'is not', null)
      .where('asset_exif.model', 'is not', null)
      .groupBy(['asset_exif.make', 'asset_exif.model'])
      .orderBy('count', 'desc')
      .limit(TOP_RESULTS_LIMIT)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getTopLenses(userId: string) {
    return this.db
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .select('asset_exif.lensModel')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('asset.ownerId', '=', userId)
      .where('asset.deletedAt', 'is', null)
      .where('asset_exif.lensModel', 'is not', null)
      .groupBy('asset_exif.lensModel')
      .orderBy('count', 'desc')
      .limit(TOP_RESULTS_LIMIT)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getTopCities(userId: string) {
    return this.db
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .select('asset_exif.city')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('asset.ownerId', '=', userId)
      .where('asset.deletedAt', 'is', null)
      .where('asset_exif.city', 'is not', null)
      .groupBy('asset_exif.city')
      .orderBy('count', 'desc')
      .limit(TOP_RESULTS_LIMIT)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getTopCountries(userId: string) {
    return this.db
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .select('asset_exif.country')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('asset.ownerId', '=', userId)
      .where('asset.deletedAt', 'is', null)
      .where('asset_exif.country', 'is not', null)
      .groupBy('asset_exif.country')
      .orderBy('count', 'desc')
      .limit(TOP_RESULTS_LIMIT)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getStorageByType(userId: string) {
    return this.db
      .selectFrom('asset')
      .leftJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .select('asset.type')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .select(sql<number>`coalesce(sum(${sql.ref('asset_exif.fileSizeInByte')}), 0)`.as('size'))
      .where('asset.ownerId', '=', userId)
      .where('asset.deletedAt', 'is', null)
      .groupBy('asset.type')
      .execute();
  }
}
