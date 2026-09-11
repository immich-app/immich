import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  type Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
} from '@immich/sql-tools';
import { WorkflowResult } from 'src/enum.js';
import { WorkflowStepTable } from 'src/schema/tables/workflow-step.table.js';
import { WorkflowTable } from 'src/schema/tables/workflow.table.js';

@Table('workflow_log')
export class WorkflowLogTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @ForeignKeyColumn(() => WorkflowTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', index: true })
  workflowId!: string;

  @Column()
  result!: WorkflowResult;

  @ForeignKeyColumn(() => WorkflowStepTable, { onDelete: 'SET NULL', onUpdate: 'CASCADE', nullable: true })
  workflowStepId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  triggerDataId!: string | null;

  @Column({ type: 'uuid' })
  runId!: string;
}
