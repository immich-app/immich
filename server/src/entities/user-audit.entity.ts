import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users_audit')
@Index('IDX_users_audit_deleted_at_asc_user_id_asc', ['deletedAt', 'userId'])
export class UserAuditEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'uuid' })
  userId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  deletedAt!: Date;
}
