import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  ColumnIndex,
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  Unique,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('tags')
@UpdatedAtTrigger('tags_updated_at')
@Unique({ columns: ['userId', 'value'] })
export class TagTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  userId!: string;

  @Column()
  value!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'character varying', nullable: true, default: null })
  color!: string | null;

  @ForeignKeyColumn(() => TagTable, { nullable: true, onDelete: 'CASCADE' })
  parentId?: string;

  @ColumnIndex('IDX_tags_update_id')
  @UpdateIdColumn()
  updateId!: string;
}
