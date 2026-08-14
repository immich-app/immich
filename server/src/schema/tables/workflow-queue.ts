import { Column, ForeignKeyColumn, Generated, PrimaryGeneratedColumn, Table } from '@immich/sql-tools';
import { WorkflowTable } from 'src/schema/tables/workflow.table';

@Table('workflow_queue')
export class WorkflowQueueTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => WorkflowTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  workflowId!: string;

  @Column({ type: 'jsonb' })
  data!: unknown[];
}
