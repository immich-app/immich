import { Column, Generated, Index, Table, Timestamp } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators';

@Table('storage_migration_log')
@Index({ name: 'IDX_storage_migration_log_batchId', columns: ['batchId'] })
@Index({ name: 'IDX_storage_migration_log_entityId', columns: ['entityId'] })
export class StorageMigrationLogTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'character varying' })
  entityType!: string;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column({ type: 'character varying', nullable: true })
  fileType!: string | null;

  @Column({ type: 'text' })
  oldPath!: string;

  @Column({ type: 'text' })
  newPath!: string;

  @Column({ type: 'character varying' })
  direction!: string;

  @Column({ type: 'uuid' })
  batchId!: string;

  @Column({ type: 'timestamp with time zone', default: () => 'clock_timestamp()' })
  migratedAt!: Generated<Timestamp>;
}
