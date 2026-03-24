import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { CreateIdColumn, UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetTable } from 'src/schema/tables/asset.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space')
@UpdatedAtTrigger('shared_space_updatedAt')
export class SharedSpaceTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', nullable: false })
  createdById!: string;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'SET NULL', nullable: true })
  thumbnailAssetId!: string | null;

  @Column({ type: 'character varying', length: 20, nullable: true })
  color!: string | null;

  @Column({ type: 'integer', nullable: true })
  thumbnailCropY!: number | null;

  @Column({ type: 'boolean', default: true })
  faceRecognitionEnabled!: Generated<boolean>;

  @Column({ type: 'boolean', default: true })
  petsEnabled!: Generated<boolean>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastActivityAt!: Timestamp | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @CreateIdColumn({ index: true })
  createId!: Generated<string>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
