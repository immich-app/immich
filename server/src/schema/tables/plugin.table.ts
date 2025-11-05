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
  Person = 'person',
}

export enum PluginTriggerType {
  AssetCreate = 'AssetCreate',
  PersonRecognized = 'PersonRecognized',
}

export type PluginTrigger = {
  name: string;
  type: PluginTriggerType;
  description: string;
  context: PluginContext;
  schema: JSONSchema | null;
};

export const pluginTriggers: PluginTrigger[] = [
  {
    name: 'Asset Uploaded',
    type: PluginTriggerType.AssetCreate,
    description: 'Triggered when a new asset is uploaded',
    context: PluginContext.Asset,
    schema: {
      type: 'object',
      properties: {
        assetType: {
          type: 'string',
          description: 'Type of the asset',
          default: 'ALL',
          enum: ['Image', 'Video', 'All'],
        },
      },
    },
  },
  {
    name: 'Person Recognized',
    type: PluginTriggerType.PersonRecognized,
    description: 'Triggered when a person is detected in an asset',
    context: PluginContext.Person,
    schema: null,
  },
];

@Table('plugin')
export class PluginTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @Column({ index: true, unique: true })
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

@Index({ columns: ['supportedContexts'], using: 'gin' })
@Table('plugin_filter')
export class PluginFilterTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @ForeignKeyColumn(() => PluginTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @Column({ index: true })
  pluginId!: string;

  @Column({ index: true, unique: true })
  name!: string;

  @Column()
  displayName!: string;

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
  name!: string;

  @Column()
  displayName!: string;

  @Column()
  description!: string;

  @Column({ type: 'character varying', array: true })
  supportedContexts!: Generated<PluginContext[]>;

  @Column({ type: 'jsonb', nullable: true })
  schema!: JSONSchema | null;
}
