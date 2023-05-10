import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('partners')
export class PartnerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, (user) => user.sharedBy, { onDelete: 'CASCADE' })
  sharedBy!: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.sharedWith, { onDelete: 'CASCADE' })
  sharedWith!: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt?: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt?: string;
}
