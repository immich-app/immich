import { PluginTriggerType } from 'src/enum';
import { PluginActionTable, PluginFilterTable } from 'src/schema/tables/plugin.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
} from 'src/sql-tools';
import type { ActionConfig, FilterConfig } from 'src/types/plugin-schema.types';

@Table('workflow')
export class WorkflowTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column()
  triggerType!: PluginTriggerType;

  @Column({ nullable: true })
  name!: string | null;

  @Column()
  description!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;
}

@Index({ columns: ['workflowId', 'order'] })
@Index({ columns: ['pluginFilterId'] })
@Table('workflow_filter')
export class WorkflowFilterTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => WorkflowTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  workflowId!: Generated<string>;

  @ForeignKeyColumn(() => PluginFilterTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  pluginFilterId!: string;

  @Column({ type: 'jsonb', nullable: true })
  filterConfig!: FilterConfig | null;

  @Column({ type: 'integer' })
  order!: number;
}

@Index({ columns: ['workflowId', 'order'] })
@Index({ columns: ['pluginActionId'] })
@Table('workflow_action')
export class WorkflowActionTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => WorkflowTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  workflowId!: Generated<string>;

  @ForeignKeyColumn(() => PluginActionTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  pluginActionId!: string;

  @Column({ type: 'jsonb', nullable: true })
  actionConfig!: ActionConfig | null;

  @Column({ type: 'integer' })
  order!: number;
}
