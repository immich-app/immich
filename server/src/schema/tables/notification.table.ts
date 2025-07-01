import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { NotificationLevel, NotificationType } from 'src/enum';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('notifications')
@UpdatedAtTrigger('notifications_updated_at')
export class NotificationTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @DeleteDateColumn()
  deletedAt!: Timestamp | null;

  @UpdateIdColumn({ indexName: 'IDX_notifications_update_id' })
  updateId!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  userId!: string;

  @Column({ default: NotificationLevel.Info })
  level!: Generated<NotificationLevel>;

  @Column({ default: NotificationLevel.Info })
  type!: Generated<NotificationType>;

  @Column({ type: 'jsonb', nullable: true })
  data!: any | null;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  readAt!: Timestamp | null;
}
