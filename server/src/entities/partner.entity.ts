import { UserEntity } from 'src/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/** @deprecated delete after coming up with a migration workflow for kysely */
@Entity('partners')
export class PartnerEntity {
  @PrimaryColumn('uuid')
  sharedById!: string;

  @PrimaryColumn('uuid')
  sharedWithId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'sharedById' })
  sharedBy!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'sharedWithId' })
  sharedWith!: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Index('IDX_partners_update_id')
  @Column({ type: 'uuid', nullable: false, default: () => 'immich_uuid_v7()' })
  updateId?: string;

  @Column({ type: 'boolean', default: false })
  inTimeline!: boolean;
}
