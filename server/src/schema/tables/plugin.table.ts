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
}

/**
 *
 */
export enum PluginContext {
  ASSET = 'Asset',
  ALBUM = 'Album',
  USER = 'User',
  PERSON = 'Person',
}

export enum PluginTrigger {
  ASSET_UPLOADED = 'AssetUpload',
  ASSET_ARCHIVED = 'AssetArchived',
  ASSET_FAVORITED = 'AssetFavorited',
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
  type!: Generated<PluginTrigger>;

  @Column()
  displayName!: string;

  @Column()
  description!: string;

  @Column({ type: 'character varying' })
  context!: Generated<PluginContext>;

  @Column()
  functionName!: string;

  @Column({ type: 'jsonb', nullable: true })
  schema!: object;
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

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column()
  description!: string;

  @Column({ type: 'character varying', array: true })
  supportedContexts!: Generated<PluginContext[]>;

  @Column()
  functionName!: string;

  @Column({ type: 'jsonb', nullable: true })
  schema!: object;
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

  @Column()
  name!: string;

  @Column()
  displayName!: string;

  @Column()
  description!: string;

  @Column({ type: 'character varying', array: true })
  supportedContexts!: Generated<PluginContext[]>;

  @Column()
  functionName!: string;

  @Column({ type: 'jsonb', nullable: true })
  schema!: object;
}
