import { ColumnType } from 'kysely';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, CreateDateColumn, Table } from 'src/sql-tools';

type Timestamp = ColumnType<Date, Date | string, Date | string>;
type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;

@Table('memories_audit')
export class MemoryAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'uuid', indexName: 'IDX_memories_audit_memory_id' })
  memoryId!: string;

  @Column({ type: 'uuid', indexName: 'IDX_memories_audit_user_id' })
  userId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', indexName: 'IDX_memories_audit_deleted_at' })
  deletedAt!: Timestamp;
}
