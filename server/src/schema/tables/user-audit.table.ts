import { Column, CreateDateColumn, Generated, Table, Timestamp } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators';

@Table('user_audit')
export class UserAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'uuid' })
  userId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', index: true })
  deletedAt!: Generated<Timestamp>;
}
