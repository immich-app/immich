import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { isEmpty, isUndefined, omitBy } from 'lodash';
import { InjectKysely } from 'nestjs-kysely';
import { AssetFiles, DB } from 'src/db';
import { ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileEntity, searchAssetFileBuilder } from 'src/entities/asset-files.entity';
import { AssetFileType } from 'src/enum';
import { AssetFileSearchOptions } from 'src/repositories/search.repository';
import { anyUuid, asUuid, unnest } from 'src/utils/database';
import { Paginated, paginationHelper, PaginationOptions } from 'src/utils/pagination';

export interface UpsertFileOptions {
  assetId: string;
  type: AssetFileType;
  path: string;
}

@Injectable()
export class AssetFileRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  createAll(assetFiles: Insertable<AssetFiles>[]): Promise<AssetFileEntity[]> {
    return this.db.insertInto('asset_files').values(assetFiles).returningAll().execute() as any as Promise<
      AssetFileEntity[]
    >;
  }

  async getAll(
    pagination: PaginationOptions,
    { orderDirection, ...options }: AssetFileSearchOptions = {},
  ): Paginated<AssetFileEntity> {
    const builder = searchAssetFileBuilder(this.db, options)
      .orderBy('asset_files.createdAt', orderDirection ?? 'asc')
      .limit(pagination.take + 1)
      .offset(pagination.skip ?? 0);
    const items = await builder.execute();
    return paginationHelper(items as any as AssetFileEntity[], pagination.take);
  }

  getById(id: string): Promise<AssetFileEntity | undefined> {
    return this.db
      .selectFrom('asset_files')
      .selectAll('asset_files')
      .where('asset_files.id', '=', asUuid(id))
      .limit(1)
      .executeTakeFirst() as any as Promise<AssetFileEntity | undefined>;
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  async getByIds(ids: string[]): Promise<AssetFileEntity[]> {
    const res = await this.db
      .selectFrom('asset_files')
      .selectAll('asset_files')
      .where('asset_files.id', '=', anyUuid(ids))
      .execute();

    return res as any as AssetFileEntity[];
  }

  async update(assetFile: Updateable<AssetFiles> & { id: string }): Promise<AssetFileEntity> {
    const value = omitBy(assetFile, isUndefined);
    delete value.id;
    if (!isEmpty(value)) {
      return this.db
        .with('asset_files', (qb) =>
          qb.updateTable('asset_files').set(assetFile).where('id', '=', asUuid(assetFile.id)).returningAll(),
        )
        .selectFrom('asset_files')
        .selectAll('asset_files')
        .executeTakeFirst() as Promise<AssetFileEntity>;
    }

    return this.getById(assetFile.id) as Promise<AssetFileEntity>;
  }

  async upsert(file: Pick<Insertable<AssetFiles>, 'id' | 'assetId' | 'path' | 'type'>): Promise<AssetFileEntity> {
    if (!file.assetId && file.type !== AssetFileType.SIDECAR) {
      throw new Error('Asset ID is required for file upsert');
    }

    console.warn('Upserting asset file', { file });

    const value = { ...file, assetId: file.assetId ? asUuid(file.assetId) : null };

    const newFile = (await this.db
      .insertInto('asset_files')
      .values(value)
      .onConflict((oc) =>
        oc.columns(['assetId', 'type']).doUpdateSet((eb) => ({
          path: eb.ref('excluded.path'),
        })),
      )
      .returningAll()
      .execute()) as any as Promise<AssetFileEntity>;

    return newFile;
  }

  async upsertAll(files: Pick<Insertable<AssetFiles>, 'assetId' | 'path' | 'type'>[]): Promise<AssetFileEntity[]> {
    if (files.length === 0) {
      return [];
    }

    const values = files.map((row) => ({ ...row, assetId: row.assetId ? asUuid(row.assetId) : null }));
    return (await this.db
      .insertInto('asset_files')
      .values(values)
      .onConflict((oc) =>
        oc
          .columns(['assetId', 'type'])
          .where('type', '<>', 'sidecar')
          .doUpdateSet((eb) => ({
            path: eb.ref('excluded.path'),
          })),
      )
      .returningAll()
      .execute()) as any as Promise<AssetFileEntity[]>;
  }

  async getSidecarsLikePath(assetPath: string): Promise<AssetFileEntity | undefined> {
    const assetPathWithoutExtension = assetPath.replace(/[^.]+$/, '');
    return this.db
      .selectFrom('asset_files')
      .selectAll('asset_files')
      .where('asset_files.path', 'like', `${assetPathWithoutExtension}%`)
      .where('asset_files.type', '=', AssetFileType.SIDECAR)
      .limit(1)
      .executeTakeFirst() as any as Promise<AssetFileEntity | undefined>;
  }

  @GenerateSql({
    params: [{ paths: [DummyValue.STRING] }],
  })
  async filterNewSidecarPaths(paths: string[]): Promise<string[]> {
    const result = await this.db
      .selectFrom(unnest(paths).as('path'))
      .select('path')
      .where((eb) =>
        eb.not(
          eb.exists(this.db.selectFrom('asset_files').select('path').whereRef('asset_files.path', '=', eb.ref('path'))),
        ),
      )
      .execute();

    return result.map((row) => row.path as string);
  }

  async remove(assetFile: { id: string }): Promise<void> {
    await this.db.deleteFrom('asset_files').where('id', '=', asUuid(assetFile.id)).execute();
  }

  async removeAll(ids: string[]): Promise<void> {
    await this.db.deleteFrom('asset_files').where('id', 'in', anyUuid(ids)).execute();
  }

  streamSidecarIds() {
    return this.db.selectFrom('asset_files').select(['id']).where('type', '=', AssetFileType.SIDECAR).stream();
  }

  async getSidecarCount(): Promise<number> {
    const { count } = await this.db
      .selectFrom('asset_files')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('type', '=', AssetFileType.SIDECAR)
      .executeTakeFirstOrThrow();

    return Number(count);
  }
}
