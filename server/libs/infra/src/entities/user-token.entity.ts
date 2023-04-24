import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('user_token')
export class UserTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ select: false })
  token!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: string;

  @Column({ default: '' })
  deviceType!: string;

  @Column({ default: '' })
  deviceOS!: string;
}
