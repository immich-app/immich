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
  UpdateIdColumn,
} from 'src/sql-tools';

@Table('tags')
@Unique({ columns: ['userId', 'value'] })
export class TagTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  value!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ColumnIndex('IDX_tags_update_id')
  @UpdateIdColumn()
  updateId!: string;

  @Column({ type: 'character varying', nullable: true, default: null })
  color!: string | null;

  @ForeignKeyColumn(() => TagTable, { nullable: true, onDelete: 'CASCADE' })
  parentId?: string;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  userId!: string;
}
