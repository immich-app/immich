import { Column, Generated, PrimaryGeneratedColumn, Table, Timestamp } from 'src/sql-tools';

@Table({ name: 'events_audit' })
export class EventAuditTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column()
  eventId!: string;

  @Column()
  userId!: string;

  @Column({ default: 'clock_timestamp()' })
  deletedAt!: Generated<Timestamp>;
}
