import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { AssetVisibility } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';

export interface ClassificationFaceSummary {
  hasAssignedFace: boolean;
  hasNamedPerson: boolean;
  hasNamedVisiblePerson: boolean;
}

@Injectable()
export class ClassificationRepository {
  constructor(
    @InjectKysely() private db: Kysely<DB>,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(ClassificationRepository.name);
  }

  async removeAutoTagAssignments(categoryName: string) {
    const tagValue = `Auto/${categoryName}`;

    const tags = await this.db.selectFrom('tag').select('id').where('value', '=', tagValue).execute();

    if (tags.length === 0) {
      return;
    }

    const tagIds = tags.map((t) => t.id);

    const affectedAssets = await this.db
      .selectFrom('tag_asset')
      .select('assetId')
      .where('tagId', 'in', tagIds)
      .execute();

    const assetIds = affectedAssets.map((a) => a.assetId);

    if (assetIds.length > 0) {
      await this.db
        .updateTable('asset')
        .set({ visibility: AssetVisibility.Timeline })
        .where('id', 'in', assetIds)
        .where('visibility', '=', AssetVisibility.Archive)
        .execute();
    }

    await this.db.deleteFrom('tag_asset').where('tagId', 'in', tagIds).execute();
  }

  async resetClassifiedAt() {
    await this.db
      .updateTable('asset_job_status')
      .set({ classifiedAt: null })
      .where('classifiedAt', 'is not', null)
      .execute();
  }

  async setClassifiedAt(assetId: string) {
    await this.db
      .updateTable('asset_job_status')
      .set({ classifiedAt: new Date().toISOString() })
      .where('assetId', '=', assetId)
      .execute();
  }

  async getFaceSummary(assetId: string): Promise<ClassificationFaceSummary> {
    const row = await this.db
      .selectFrom('asset_face')
      .innerJoin('person', 'person.id', 'asset_face.personId')
      .select([
        sql<boolean>`count(*) > 0`.as('hasAssignedFace'),
        sql<boolean>`count(*) filter (where btrim("person"."name") != '') > 0`.as('hasNamedPerson'),
        sql<boolean>`count(*) filter (where btrim("person"."name") != '' and "person"."isHidden" is false) > 0`.as(
          'hasNamedVisiblePerson',
        ),
      ])
      .where('asset_face.assetId', '=', assetId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .where('asset_face.personId', 'is not', null)
      .where('person.type', '=', 'person')
      .executeTakeFirst();

    return {
      hasAssignedFace: row?.hasAssignedFace ?? false,
      hasNamedPerson: row?.hasNamedPerson ?? false,
      hasNamedVisiblePerson: row?.hasNamedVisiblePerson ?? false,
    };
  }

  streamUnclassifiedAssets() {
    return this.db
      .selectFrom('asset_job_status as ajs')
      .innerJoin('asset as a', 'a.id', 'ajs.assetId')
      .innerJoin('smart_search as ss', 'ss.assetId', 'a.id')
      .select(['a.id', 'a.ownerId'])
      .where('ajs.classifiedAt', 'is', null)
      .stream();
  }
}
