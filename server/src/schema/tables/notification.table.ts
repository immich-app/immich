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
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { NotificationLevel, NotificationType } from 'src/enum';
import { UserTable } from 'src/schema/tables/user.table';

@Table('notification')
@UpdatedAtTrigger('notification_updatedAt')
export class NotificationTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @DeleteDateColumn()
  deletedAt!: Timestamp | null;

  @UpdateIdColumn({ index: true })
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
