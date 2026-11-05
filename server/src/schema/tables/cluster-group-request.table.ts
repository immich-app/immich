import {
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  type Generated,
} from '@immich/sql-tools';
import { ClusterGroupTable } from 'src/schema/tables/cluster-group.table.js';
import { UserTable } from 'src/schema/tables/user.table.js';

@Table('cluster_group_request')
@Unique({ columns: ['clusterGroupId', 'userId'] })
export class ClusterGroupRequestTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => ClusterGroupTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  clusterGroupId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
