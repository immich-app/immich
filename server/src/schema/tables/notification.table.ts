import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { NotificationLevel, NotificationType } from 'src/enum';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('notifications')
@UpdatedAtTrigger('notifications_updated_at')
export class NotificationTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @UpdateIdColumn({ indexName: 'IDX_notifications_update_id' })
  updateId?: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: true })
  userId!: string;

  @Column({ default: NotificationLevel.Info })
  level!: NotificationLevel;

  @Column({ default: NotificationLevel.Info })
  type!: NotificationType;

  @Column({ type: 'jsonb', nullable: true })
  data!: any | null;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  readAt?: Date | null;
}
