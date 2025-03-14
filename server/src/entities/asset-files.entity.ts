import { AssetEntity } from 'src/entities/asset.entity';
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
  fileCreatedAt!: Date | null;

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
