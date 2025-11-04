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

export enum PluginContext {
  Asset = 'asset',
  Album = 'album',
  User = 'user',
  Person = 'person',
}

export enum PluginTriggerName {
  AssetUploaded = 'asset_uploaded',
  PersonRecognized = 'person_recognized',
}

export enum PluginFilterName {
  FileName = 'file_name',
  FileType = 'file_type',
  PersonName = 'person_name',
}

export enum PluginActionName {
  Archive = 'archive',
  Favorite = 'favorite',
  AddToAlbum = 'add_to_album',
}

@Index({ columns: ['name'], unique: true })
@Table('plugin')
export class PluginTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column()
  description!: string;

  @Column()
  author!: string;

  @Column()
  version!: string;

  @Column()
  manifestPath!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}

@Index({ columns: ['pluginId'] })
@Index({ columns: ['context'] })
@Index({ columns: ['name'], unique: true })
@Table('plugin_trigger')
export class PluginTriggerTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => PluginTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  pluginId!: string;

  @Column({ type: 'character varying' })
  name!: Generated<PluginTriggerName>;

  @Column()
  displayName!: string;

  @Column()
  description!: string;

  @Column({ type: 'character varying' })
  context!: Generated<PluginContext>;

  @Column()
  functionName!: string;

  @Column({ type: 'jsonb', nullable: true })
  schema!: JSONSchema | null;
}

@Index({ columns: ['pluginId'] })
@Index({ columns: ['supportedContexts'], using: 'gin' })
@Index({ columns: ['name'], unique: true })
@Table('plugin_filter')
export class PluginFilterTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => PluginTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  pluginId!: string;

  @Column({ type: 'character varying' })
  name!: Generated<PluginFilterName>;

  @Column()
  displayName!: string;

  @Column()
  description!: string;

  @Column({ type: 'character varying', array: true })
  supportedContexts!: Generated<PluginContext[]>;

  @Column()
  functionName!: string;

  @Column({ type: 'jsonb', nullable: true })
  schema!: JSONSchema | null;
}

@Index({ columns: ['pluginId'] })
@Index({ columns: ['supportedContexts'], using: 'gin' })
@Index({ columns: ['name'], unique: true })
@Table('plugin_action')
export class PluginActionTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => PluginTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  pluginId!: string;

  @Column({ type: 'character varying' })
  name!: Generated<PluginActionName>;

  @Column()
  displayName!: string;

  @Column()
  description!: string;

  @Column({ type: 'character varying', array: true })
  supportedContexts!: Generated<PluginContext[]>;

  @Column()
  functionName!: string;

  @Column({ type: 'jsonb', nullable: true })
  schema!: JSONSchema | null;
}
