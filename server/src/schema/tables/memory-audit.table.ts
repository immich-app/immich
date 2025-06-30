import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, CreateDateColumn, Generated, Table, Timestamp } from 'src/sql-tools';

@Table('memories_audit')
export class MemoryAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'uuid', indexName: 'IDX_memories_audit_memory_id' })
  memoryId!: string;

  @Column({ type: 'uuid', indexName: 'IDX_memories_audit_user_id' })
  userId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', indexName: 'IDX_memories_audit_deleted_at' })
  deletedAt!: Generated<Timestamp>;
}
