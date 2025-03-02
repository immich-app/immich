import { SessionEntity } from 'src/entities/session.entity';
import { SyncEntityType } from 'src/enum';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

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

  @Index('IDX_session_sync_checkpoints_update_id')
  @Column({ type: 'uuid', nullable: false, default: () => 'immich_uuid_v7()' })
  updateId?: string;

  @Column()
  ack!: string;
}
