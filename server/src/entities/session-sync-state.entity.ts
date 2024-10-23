import { SessionEntity } from 'src/entities/session.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type SyncCheckpoint = {
  id: string;
  timestamp: string;
};

export type SyncState = {
  activity?: SyncCheckpoint;

  album?: SyncCheckpoint;
  albumUser?: SyncCheckpoint;
  albumAsset?: SyncCheckpoint;

  asset?: SyncCheckpoint;
  assetAlbum?: SyncCheckpoint;
  assetPartner?: SyncCheckpoint;

  memory?: SyncCheckpoint;

  partner?: SyncCheckpoint;

  person?: SyncCheckpoint;

  sharedLink?: SyncCheckpoint;

  stack?: SyncCheckpoint;

  tag?: SyncCheckpoint;

  user?: SyncCheckpoint;
};

@Entity('session_sync_states')
export class SessionSyncStateEntity {
  @OneToOne(() => SessionEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  session?: SessionEntity;

  @PrimaryColumn()
  sessionId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  state?: SyncState;
}
