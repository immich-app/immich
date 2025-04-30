import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { MemoryType } from 'src/enum';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';
import { MemoryData } from 'src/types';

@Table('memories')
@UpdatedAtTrigger('memories_updated_at')
export class MemoryTable<T extends MemoryType = MemoryType> {
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
  type!: T;

  @Column({ type: 'jsonb' })
  data!: MemoryData[T];

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
