import {
  Column,
  CreateDateColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { PluginTemplate } from 'src/dtos/plugin.dto';

@Unique({ columns: ['name', 'version'] })
@Table('plugin')
export class PluginTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @Column({ type: 'boolean', default: true })
  enabled!: Generated<boolean>;

  @Column({ index: true, unique: true })
  name!: string;

  @Column()
  version!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column()
  author!: string;

  @Column({ type: 'bytea' })
  wasmBytes!: Buffer;

  @Column({ type: 'jsonb' })
  templates!: PluginTemplate[];

  @Column({ type: 'bytea' })
  sha256hash!: Buffer;

  @Column({ type: 'character varying', default: [], array: true })
  allowedHosts!: Generated<string[]>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
