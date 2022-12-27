import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TagEntity } from './tag.entity';

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

  @Column({ unique: true })
  email!: string;

  @Column({ default: '', select: false })
  password?: string;

  @Column({ default: '' })
  oauthId!: string;

  @Column({ default: '' })
  profileImagePath!: string;

  @Column({ default: true })
  shouldChangePassword!: boolean;

  @CreateDateColumn()
  createdAt!: string;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => TagEntity, (tag) => tag.user)
  tags!: TagEntity[];
}
