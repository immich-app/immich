import { PrimaryGeneratedUuidV7Column } from 'src/decorators';
import { Column, CreateDateColumn, Generated, Table, Timestamp } from 'src/sql-tools';

@Table('person_audit')
export class PersonAuditTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'uuid', index: true })
  personId!: string;

  @Column({ type: 'uuid', index: true })
  ownerId!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()', index: true })
  deletedAt!: Generated<Timestamp>;
}
