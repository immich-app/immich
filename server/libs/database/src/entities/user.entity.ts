import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: '' })
  firstName!: string;

  @Column({ default: '' })
  lastName!: string;

  @Column({ default: false })
  isAdmin!: boolean;

  @Column()
  email!: string;

  @Column({ default: '', select: false })
  password?: string;

  @Column({ default: '', select: false })
  salt?: string;

  @Column({ default: '', select: false })
  oauthId!: string;

  @Column({ default: '' })
  profileImagePath!: string;

  @Column({ default: true })
  shouldChangePassword!: boolean;

  @CreateDateColumn()
  createdAt!: string;

  @DeleteDateColumn()
  deletedAt?: Date;
}
