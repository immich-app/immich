import { Column, CreateDateColumn, Generated, Table, Timestamp, Unique } from '@immich/sql-tools';
import { PrimaryGeneratedUuidV7Column } from 'src/decorators';

@Table('fuji_cleanup_outbox')
@Unique({ columns: ['path'] })
export class FujiCleanupOutboxTable {
  @PrimaryGeneratedUuidV7Column()
  id!: Generated<string>;

  @Column({ type: 'uuid', index: true })
  assetId!: string;

  @Column({ type: 'character varying' })
  path!: string;

  @CreateDateColumn({ default: () => 'clock_timestamp()' })
  createdAt!: Generated<Timestamp>;

  @Column({ type: 'timestamp with time zone', default: () => 'clock_timestamp()', index: true })
  availableAt!: Generated<Timestamp>;
}
