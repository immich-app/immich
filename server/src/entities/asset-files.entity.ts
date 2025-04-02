import { Kysely, sql } from 'kysely';
import { DB } from 'src/db';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetFileType } from 'src/enum';
import { AssetFileSearchOptions } from 'src/repositories/search.repository';
import { asUuid } from 'src/utils/database';
export class AssetFileEntity {
  id!: string;
  assetId!: string;
  asset?: AssetEntity;
  fileModifiedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
  updateId?: string;
  type!: AssetFileType;
  path!: string;
}

export type SidecarAssetFileEntity = AssetFileEntity & {
  // Sidecar files are discovered on disk without immediately knowing if there's a corresponding asset
  assetId: string | null;
  asset: AssetEntity | null;
};

export function searchAssetFileBuilder(kysely: Kysely<DB>, options: AssetFileSearchOptions) {
  return kysely
    .selectFrom('asset_files')
    .selectAll('asset_files')
    .$if(!!options.id, (qb) => qb.where('asset_files.id', '=', asUuid(options.id!)))
    .$if(!!options.assetId, (qb) => qb.where('asset_files.assetId', '=', asUuid(options.assetId!)))
    .$if(!!options.path, (qb) =>
      qb.where(sql`f_unaccent(asset_files."path")`, 'ilike', sql`'%' || f_unaccent(${options.path}) || '%'`),
    )
    .$if(!!options.type, (qb) => qb.where('asset_files.type', '=', options.type!));
}
