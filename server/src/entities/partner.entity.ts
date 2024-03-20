import { UserEntity } from 'src/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ type: 'boolean', default: false })
  inTimeline!: boolean;
}
