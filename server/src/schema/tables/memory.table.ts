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
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('memories')
@UpdatedAtTrigger('memories_updated_at')
@AfterDeleteTrigger({
  name: 'memories_delete_audit',
  scope: 'statement',
  function: memories_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
export class MemoryTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column()
  type!: MemoryType;

  @Column({ type: 'jsonb' })
  data!: object;

  /** unless set to true, will be automatically deleted in the future */
  @Column({ type: 'boolean', default: false })
  isSaved!: boolean;

  /** memories are sorted in ascending order by this value */
  @Column({ type: 'timestamp with time zone' })
  memoryAt!: Date;

  /** when the user last viewed the memory */
  @Column({ type: 'timestamp with time zone', nullable: true })
  seenAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  showAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  hideAt?: Date;

  @UpdateIdColumn({ indexName: 'IDX_memories_update_id' })
  updateId?: string;
}
