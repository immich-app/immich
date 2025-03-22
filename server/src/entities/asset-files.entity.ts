import { Kysely, sql } from 'kysely';
import { DB } from 'src/db';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetFileType } from 'src/enum';
import { AssetFileSearchOptions } from 'src/repositories/search.repository';
import { asUuid } from 'src/utils/database';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Unique('UQ_assetId_type', ['assetId', 'type'])
@Entity('asset_files')
export class AssetFileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_asset_files_assetId')
  @Column({ nullable: true, default: null })
  assetId!: string;

  @ManyToOne(() => AssetEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  asset?: AssetEntity;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  fileModifiedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index('IDX_asset_files_update_id')
  @Column({ type: 'uuid', nullable: false, default: () => 'immich_uuid_v7()' })
  updateId?: string;

  @Column()
  type!: AssetFileType;

  @Column()
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
