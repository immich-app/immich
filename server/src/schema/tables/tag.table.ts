import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';

@Table('tag')
@UpdatedAtTrigger('tag_updatedAt')
@Unique({ columns: ['userId', 'value'] })
export class TagTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    // [userId, value] makes this redundant
    index: false,
  })
  userId!: string;

  @Column()
  value!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ type: 'character varying', nullable: true, default: null })
  color!: string | null;

  @ForeignKeyColumn(() => TagTable, { nullable: true, onDelete: 'CASCADE' })
  parentId!: string | null;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
