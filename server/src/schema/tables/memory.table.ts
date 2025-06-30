import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { MemoryType } from 'src/enum';
import { memories_delete_audit } from 'src/schema/functions';
import { UserTable } from 'src/schema/tables/user.table';
import {
  AfterDeleteTrigger,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('memories')
@UpdatedAtTrigger('memories_updated_at')
@AfterDeleteTrigger({
  scope: 'statement',
  function: memories_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
export class MemoryTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @DeleteDateColumn()
  deletedAt!: Timestamp | null;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column()
  type!: MemoryType;

  @Column({ type: 'jsonb' })
  data!: object;

  /** unless set to true, will be automatically deleted in the future */
  @Column({ type: 'boolean', default: false })
  isSaved!: Generated<boolean>;

  /** memories are sorted in ascending order by this value */
  @Column({ type: 'timestamp with time zone' })
  memoryAt!: Timestamp;

  /** when the user last viewed the memory */
  @Column({ type: 'timestamp with time zone', nullable: true })
  seenAt!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  showAt!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  hideAt!: Timestamp | null;

  @UpdateIdColumn({ indexName: 'IDX_memories_update_id' })
  updateId!: Generated<string>;
}
