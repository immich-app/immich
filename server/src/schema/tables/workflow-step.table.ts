import { WorkflowStepConfig } from '@immich/plugin-sdk';
import { Column, ForeignKeyColumn, PrimaryGeneratedColumn, Table } from '@immich/sql-tools';
import { Generated } from 'kysely';
import { PluginMethodTable } from 'src/schema/tables/plugin-method.table';
import { WorkflowTable } from 'src/schema/tables/workflow.table';

@Table('workflow_step')
export class WorkflowStepTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @ForeignKeyColumn(() => WorkflowTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  workflowId!: string;

  @ForeignKeyColumn(() => PluginMethodTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  pluginMethodId!: string;

  @Column({ type: 'jsonb', nullable: true })
  config!: WorkflowStepConfig | null;

  @Column({ type: 'integer' })
  order!: number;
}
