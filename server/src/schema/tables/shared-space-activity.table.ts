import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
} from '@immich/sql-tools';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space_activity')
@Index({ columns: ['spaceId', 'createdAt'] })
export class SharedSpaceActivityTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', index: false })
  spaceId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'SET NULL', nullable: true })
  userId!: string | null;

  @Column({ type: 'character varying', length: 30 })
  type!: string;

  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
