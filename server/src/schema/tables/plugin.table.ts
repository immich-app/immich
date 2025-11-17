import { PluginContext } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';
import type { JSONSchema } from 'src/types/plugin-schema.types';

@Table('plugin')
export class PluginTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @Column({ index: true, unique: true })
  name!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column()
  author!: string;

  @Column()
  version!: string;

  @Column()
  wasmPath!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}

@Index({ columns: ['supportedContexts'], using: 'gin' })
@Table('plugin_filter')
export class PluginFilterTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => PluginTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @Column({ index: true })
  pluginId!: string;

  @Column({ index: true, unique: true })
  methodName!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({ type: 'character varying', array: true })
  supportedContexts!: Generated<PluginContext[]>;

  @Column({ type: 'jsonb', nullable: true })
  schema!: JSONSchema | null;
}

@Index({ columns: ['supportedContexts'], using: 'gin' })
@Table('plugin_action')
export class PluginActionTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => PluginTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @Column({ index: true })
  pluginId!: string;

  @Column({ index: true, unique: true })
  methodName!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({ type: 'character varying', array: true })
  supportedContexts!: Generated<PluginContext[]>;

  @Column({ type: 'jsonb', nullable: true })
  schema!: JSONSchema | null;
}
