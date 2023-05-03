import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('partners')
export class PartnerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  sharedBy!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  sharedWith!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt?: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt?: string;
}
