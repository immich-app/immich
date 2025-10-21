import { Insertable } from 'kysely';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

const plugin: Insertable<PluginTable> = {
  version: 1,
  id: '123',
  name: 'Immich Core Plugin',
  description: 'Core plugins for Immich',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  packageId: 'immich-plugin-',
};

@Table('plugins')
export class PluginTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @Column({ unique: true })
  packageId!: string;

  @Column()
  version!: number;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({ type: 'boolean', default: true })
  isEnabled!: Generated<boolean>;

  @Column({ type: 'boolean', default: false })
  isInstalled!: Generated<boolean>;

  @Column({ type: 'boolean', default: false })
  isTrusted!: Generated<boolean>;

  @Column({ nullable: true })
  requirePath!: string | null;
}
