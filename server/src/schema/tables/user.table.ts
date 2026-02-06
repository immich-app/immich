import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserStatus } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('user')
@UpdatedAtTrigger('user_updatedAt')
@Index({ columns: ['updatedAt', 'id'] })
export class UserTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ unique: true })
  email!: string;

  @Column({ default: '' })
  password!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @Column({ type: 'boolean', default: false })
  isAdmin!: Generated<boolean>;

  @Column({ type: 'boolean', default: true })
  shouldChangePassword!: Generated<boolean>;

  @DeleteDateColumn()
  deletedAt!: Timestamp | null;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ default: '' })
  name!: Generated<string>;

  @Column({ type: 'character varying', default: UserStatus.Active })
  status!: Generated<UserStatus>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
