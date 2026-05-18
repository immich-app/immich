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

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
