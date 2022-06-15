import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  isAdmin: boolean;

  @Column()
  email: string;

  @Column({ select: false, nullable: true })
  password: string | null;

  @Column({ select: false, nullable: true })
  salt: string | null;

  @Column()
  profileImagePath: string;

  @Column()
  isFirstLoggedIn: boolean;

  @CreateDateColumn()
  createdAt: string;

  @Column({default: true})
  isLocalUser: boolean;
}
