import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
} from 'src/sql-tools';

@Table({ name: 'invitation' })
@Index({ columns: ['token'], unique: true })
@Index({ columns: ['email'] })
export class InvitationTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column()
  email!: string;

  @Column()
  token!: string;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  invitedById!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Timestamp;

  @Column({ type: 'timestamp with time zone', nullable: true })
  acceptedAt!: Timestamp | null;
}
