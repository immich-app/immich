import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { WorkflowTrigger } from 'src/enum';
import { UserTable } from 'src/schema/tables/user.table';

@Table('workflow')
@UpdatedAtTrigger('workflow_updatedAt')
export class WorkflowTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column()
  trigger!: WorkflowTrigger;

  @Column({ nullable: true })
  name!: string | null;

  @Column({ nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn()
  updateId!: Generated<string>;

  @Column({ type: 'boolean', default: true })
  enabled!: Generated<boolean>;
}
