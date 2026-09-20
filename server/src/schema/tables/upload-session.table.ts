import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators.js';
import { UserTable } from 'src/schema/tables/user.table.js';

@Table('upload_session')
export class UploadSessionTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  userId!: string;

  @Column()
  filename!: string;

  @Column({ type: 'bigint' })
  fileSize!: string;

  @Column({ type: 'bytea' })
  checksum!: Buffer;

  @Column({ type: 'bigint' })
  chunkSize!: string;

  @Column({ type: 'bigint', default: 0 })
  received!: string;

  @Column()
  status!: string;

  @Column()
  path!: string;

  @Column({ type: 'jsonb', default: '[]' })
  metadata!: Generated<unknown>;

  @Column({ type: 'boolean', nullable: true })
  isFavorite!: boolean | null;

  @Column({ nullable: true })
  visibility!: string | null;

  @Column({ type: 'uuid', nullable: true })
  livePhotoVideoId!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  fileCreatedAt!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  fileModifiedAt!: Timestamp | null;

  @Column({ type: 'integer', nullable: true })
  duration!: number | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
