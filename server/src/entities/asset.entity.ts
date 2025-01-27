import { AlbumEntity } from 'src/entities/album.entity';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetFileEntity } from 'src/entities/asset-files.entity';
import { AssetJobStatusEntity } from 'src/entities/asset-job-status.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { LibraryEntity } from 'src/entities/library.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { SmartSearchEntity } from 'src/entities/smart-search.entity';
import { StackEntity } from 'src/entities/stack.entity';
import { TagEntity } from 'src/entities/tag.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AssetStatus, AssetType } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const ASSET_CHECKSUM_CONSTRAINT = 'UQ_assets_owner_checksum';

@Entity('assets')
// Checksums must be unique per user and library
@Index(ASSET_CHECKSUM_CONSTRAINT, ['owner', 'checksum'], {
  unique: true,
  where: '"libraryId" IS NULL',
})
@Index('UQ_assets_owner_library_checksum' + '', ['owner', 'library', 'checksum'], {
  unique: true,
  where: '"libraryId" IS NOT NULL',
})
@Index('IDX_day_of_month', { synchronize: false })
@Index('IDX_month', { synchronize: false })
@Index('IDX_originalPath_libraryId', ['originalPath', 'libraryId'])
@Index('IDX_asset_id_stackId', ['id', 'stackId'])
@Index('idx_originalFileName_trigram', { synchronize: false })
// For all assets, each originalpath must be unique per user and library
export class AssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  deviceAssetId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: UserEntity;

  @Column()
  ownerId!: string;

  @ManyToOne(() => LibraryEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  library?: LibraryEntity | null;

  @Column({ nullable: true })
  libraryId?: string | null;

  @Column()
  deviceId!: string;

  @Column()
  type!: AssetType;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.ACTIVE })
  status!: AssetStatus;

  @Column()
  originalPath!: string;

  @OneToMany(() => AssetFileEntity, (assetFile) => assetFile.asset)
  files!: AssetFileEntity[];

  @Column({ type: 'bytea', nullable: true })
  thumbhash!: Buffer | null;

  @Column({ type: 'varchar', nullable: true, default: '' })
  encodedVideoPath!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Index('idx_asset_file_created_at')
  @Column({ type: 'timestamptz' })
  fileCreatedAt!: Date;

  @Column({ type: 'timestamptz' })
  localDateTime!: Date;

  @Column({ type: 'timestamptz' })
  fileModifiedAt!: Date;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'boolean', default: false })
  isExternal!: boolean;

  @Column({ type: 'boolean', default: false })
  isOffline!: boolean;

  @Column({ type: 'bytea' })
  @Index()
  checksum!: Buffer; // sha1 checksum

  @Column({ type: 'varchar', nullable: true })
  duration!: string | null;

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean;

  @ManyToOne(() => AssetEntity, { nullable: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
  @JoinColumn()
  livePhotoVideo!: AssetEntity | null;

  @Column({ nullable: true })
  livePhotoVideoId!: string | null;

  @Column({ type: 'varchar' })
  @Index()
  originalFileName!: string;

  @Column({ type: 'varchar', nullable: true })
  sidecarPath!: string | null;

  @OneToOne(() => ExifEntity, (exifEntity) => exifEntity.asset)
  exifInfo?: ExifEntity;

  @OneToOne(() => SmartSearchEntity, (smartSearchEntity) => smartSearchEntity.asset)
  smartSearch?: SmartSearchEntity;

  @ManyToMany(() => TagEntity, (tag) => tag.assets, { cascade: true })
  @JoinTable({ name: 'tag_asset', synchronize: false })
  tags!: TagEntity[];

  @ManyToMany(() => SharedLinkEntity, (link) => link.assets, { cascade: true })
  @JoinTable({ name: 'shared_link__asset' })
  sharedLinks!: SharedLinkEntity[];

  @ManyToMany(() => AlbumEntity, (album) => album.assets, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  albums?: AlbumEntity[];

  @OneToMany(() => AssetFaceEntity, (assetFace) => assetFace.asset)
  faces!: AssetFaceEntity[];

  @Column({ nullable: true })
  stackId?: string | null;

  @ManyToOne(() => StackEntity, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn()
  stack?: StackEntity | null;

  @OneToOne(() => AssetJobStatusEntity, (jobStatus) => jobStatus.asset, { nullable: true })
  jobStatus?: AssetJobStatusEntity;

  @Index('IDX_assets_duplicateId')
  @Column({ type: 'uuid', nullable: true })
  duplicateId!: string | null;
}
