import { CreateDateColumn, Entity, ManyToOne, PrimaryColumn, JoinColumn, UpdateDateColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('partners')
export class PartnerEntity {
  @PrimaryColumn('uuid')
  sharedById!: string;

  @PrimaryColumn('uuid')
  sharedWithId!: string;

  @ManyToOne(() => UserEntity, (user) => user.sharedBy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sharedById' })
  sharedBy!: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.sharedWith, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sharedWithId' })
  sharedWith!: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt?: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt?: string;
}
