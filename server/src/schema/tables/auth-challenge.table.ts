import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  type Generated,
  PrimaryGeneratedColumn,
  Table,
  type Timestamp,
} from '@immich/sql-tools';
import { AuthChallengeType } from 'src/enum.js';
import { UserTable } from 'src/schema/tables/user.table.js';

@Table('auth_challenge')
export class AuthChallengeTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column({ type: 'character varying' })
  type!: AuthChallengeType;

  @Column({ unique: true })
  challenge!: string;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', nullable: true })
  userId!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Timestamp;
}
