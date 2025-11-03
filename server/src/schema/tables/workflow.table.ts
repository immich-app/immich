import { PluginActionTable, PluginFilterTable, PluginTriggerTable } from 'src/schema/tables/plugin.table';
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
import type { ActionConfig, FilterConfig, TriggerConfig } from 'src/types/plugin-schema.types';

@Table('workflow')
export class WorkflowTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @ForeignKeyColumn(() => PluginTriggerTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  triggerId!: string;

  @Column({ type: 'jsonb', nullable: true })
  triggerConfig!: TriggerConfig | null;

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column()
  description!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;
}

@Index({ columns: ['workflowId', 'order'] })
@Index({ columns: ['filterId'] })
@Table('workflow_filter')
export class WorkflowFilterTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => WorkflowTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  workflowId!: string;

  @ForeignKeyColumn(() => PluginFilterTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  filterId!: string;

  @Column({ type: 'jsonb', nullable: true })
  filterConfig!: FilterConfig | null;

  @Column({ type: 'integer' })
  order!: number;
}

@Index({ columns: ['workflowId', 'order'] })
@Index({ columns: ['actionId'] })
@Table('workflow_action')
export class WorkflowActionTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => WorkflowTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  workflowId!: string;

  @ForeignKeyColumn(() => PluginActionTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  actionId!: string;

  @Column({ type: 'jsonb', nullable: true })
  actionConfig!: ActionConfig | null;

  @Column({ type: 'integer' })
  order!: number;
}
