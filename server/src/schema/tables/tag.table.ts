import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  UpdateDateColumn,
  type Generated,
} from '@immich/sql-tools';
import { UpdateIdColumn, UpdatedAtTrigger } from 'src/decorators.js';
import { UserTable } from 'src/schema/tables/user.table.js';

@Table('tag')
@UpdatedAtTrigger('tag_updatedAt')
@Unique({ columns: ['userId', 'value'] })
@Index({
  name: 'tag_userId_systemKey_uq',
  columns: ['userId', 'systemKey'],
  unique: true,
  where: '"systemKey" IS NOT NULL',
})
@Index({ name: 'tag_isPrivate_idx', columns: ['isPrivate'] })
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

  @Column({ type: 'boolean', default: false })
  isPrivate!: Generated<boolean>;

  @Column({ type: 'character varying', nullable: true, default: null })
  systemKey!: string | null;

  @ForeignKeyColumn(() => TagTable, { nullable: true, onDelete: 'CASCADE' })
  parentId!: string | null;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
