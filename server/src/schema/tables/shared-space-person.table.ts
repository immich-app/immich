import {
  Check,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { FaceIdentityTable } from 'src/schema/tables/face-identity.table';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';

@Table('shared_space_person')
@UpdatedAtTrigger('shared_space_person_updatedAt')
@Index({ name: 'shared_space_person_spaceId_idx', columns: ['spaceId'] })
@Index({
  name: 'shared_space_person_space_name_idx',
  expression: `"spaceId", "isHidden", NULLIF("name", ''), (CASE WHEN "name" = '' THEN "assetCount" END) DESC, "id"`,
})
@Index({
  name: 'shared_space_person_spaceId_identityId_key',
  columns: ['spaceId', 'identityId'],
  unique: true,
  where: '"identityId" IS NOT NULL',
})
@Index({
  name: 'shared_space_person_identityId_spaceId_idx',
  columns: ['identityId', 'spaceId'],
  where: '"identityId" IS NOT NULL',
})
@Check({
  name: 'shared_space_person_representativeFaceSource_chk',
  expression: `"representativeFaceSource" IN ('auto', 'manual')`,
})
export class SharedSpacePersonTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', index: false })
  spaceId!: string;

  @Column({ default: '', type: 'character varying' })
  name!: Generated<string>;

  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'SET NULL', nullable: true })
  representativeFaceId!: string | null;

  @Column({ type: 'character varying', default: 'auto' })
  representativeFaceSource!: Generated<'auto' | 'manual'>;

  @Column({ type: 'boolean', default: false })
  isHidden!: Generated<boolean>;

  @Column({ type: 'character varying', default: 'person' })
  type!: Generated<string>;

  @Column({ type: 'date', nullable: true })
  birthDate!: string | null;

  @Column({ type: 'integer', default: 0 })
  faceCount!: Generated<number>;

  @Column({ type: 'integer', default: 0 })
  assetCount!: Generated<number>;

  @ForeignKeyColumn(() => FaceIdentityTable, { onDelete: 'SET NULL', nullable: true, index: false })
  identityId!: string | null;

  @Column({ type: 'character varying', default: 'none' })
  nameSource!: Generated<string>;

  @Column({ type: 'character varying', nullable: true })
  nameSourceProfileType!: string | null;

  @Column({ type: 'uuid', nullable: true })
  nameSourceProfileId!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nameSourceUpdatedAt!: Timestamp | null;

  @Column({ type: 'character varying', default: 'none' })
  birthDateSource!: Generated<string>;

  @Column({ type: 'character varying', nullable: true })
  birthDateSourceProfileType!: string | null;

  @Column({ type: 'uuid', nullable: true })
  birthDateSourceProfileId!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  birthDateSourceUpdatedAt!: Timestamp | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
