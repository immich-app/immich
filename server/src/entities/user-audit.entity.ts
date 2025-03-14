import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('users_audit')
export class UserAuditEntity {
  @PrimaryColumn({ type: 'uuid', nullable: false, default: () => 'immich_uuid_v7()' })
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Index('IDX_users_audit_deleted_at')
  @CreateDateColumn({ type: 'timestamptz', default: () => 'clock_timestamp()' })
  deletedAt!: Date;
}
