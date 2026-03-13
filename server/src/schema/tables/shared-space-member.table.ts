import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { SharedSpaceRole } from 'src/enum';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space_member')
export class SharedSpaceMemberTable {
  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', primary: true, index: false })
  spaceId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  userId!: string;

  @Column({ type: 'character varying', default: SharedSpaceRole.Viewer })
  role!: Generated<string>;

  @CreateDateColumn()
  joinedAt!: Generated<Timestamp>;

  @Column({ type: 'boolean', default: true })
  showInTimeline!: Generated<boolean>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastViewedAt!: Timestamp | null;
}
