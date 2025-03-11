import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { isEmpty, isUndefined, omitBy } from 'lodash';
import { InjectKysely } from 'nestjs-kysely';
import { AssetFiles, DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileEntity } from 'src/entities/asset-files.entity';
import { AssetFileType } from 'src/enum';
import { AssetFileSearchOptions } from 'src/repositories/search.repository';
import { asUuid, unnest } from 'src/utils/database';

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

  getAll({ orderDirection, ...options }: AssetFileSearchOptions = {}) {
    return this.db
      .selectFrom('asset_files')
      .selectAll('asset_files')
      .$if(!!options.assetId, (qb) => qb.where('asset_files.assetId', '=', asUuid(options.assetId!)))
      .$if(!!options.type, (qb) => qb.where('asset_files.type', '=', options.type!))
      .orderBy('asset_files.createdAt', orderDirection ?? 'asc')
      .stream();
  }

  getById(id: string): Promise<AssetFileEntity | undefined> {
    return this.db
      .selectFrom('asset_files')
      .selectAll('asset_files')
      .where('asset_files.id', '=', asUuid(id))
      .limit(1)
      .executeTakeFirst() as any as Promise<AssetFileEntity | undefined>;
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

  async getAssetFileById(assetFileId: string): Promise<AssetFileEntity | undefined> {
    return this.db
      .selectFrom('asset_files')
      .selectAll('asset_files')
      .where('asset_files.id', '=', asUuid(assetFileId))
      .limit(1)
      .executeTakeFirst() as any as Promise<AssetFileEntity | undefined>;
  }

  async getAssetSidecarsByPath(assetPath: string): Promise<AssetFileEntity | undefined> {
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
  async filterSidecarPaths(paths: string[]): Promise<string[]> {
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
}
