import { SessionEntity } from 'src/entities/session.entity';
import { SyncEntityType } from 'src/enum';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('session_sync_checkpoints')
export class SessionSyncCheckpointEntity {
  @ManyToOne(() => SessionEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  session?: SessionEntity;

  @PrimaryColumn()
  sessionId!: string;

  @PrimaryColumn({ type: 'varchar' })
  type!: SyncEntityType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column()
  ack!: string;
}
