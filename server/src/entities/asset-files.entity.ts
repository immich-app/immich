import { AssetEntity } from 'src/entities/asset.entity';
import { LibraryEntity } from 'src/entities/library.entity';
import { AssetFileType } from 'src/enum';
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
@Index('UQ_libraryId_path', ['libraryId', 'path'], {
  unique: true,
  where: '"libraryId" IS NOT NULL',
})
@Entity('asset_files')
export class AssetFileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_asset_files_assetId')
  @Column({ nullable: true, default: null })
  assetId?: string;

  @ManyToOne(() => AssetEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  asset?: AssetEntity;

  @Column({ nullable: true, default: null })
  libraryId?: string | null;

  @ManyToOne(() => LibraryEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  library?: LibraryEntity | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  fileCreatedAt!: Date;

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
  assetId: string | null;
  asset: AssetEntity | null;
};
