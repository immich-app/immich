import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('user_token')
export class UserTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ select: false })
  token!: string;

  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: string;
}
