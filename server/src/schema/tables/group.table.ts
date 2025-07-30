import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import {
  Column,
  CreateDateColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('group')
@UpdatedAtTrigger('group_updatedAt')
@Index({ columns: ['updatedAt', 'id'] })
export class GroupTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
