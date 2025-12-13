import { SystemMetadataKey } from 'src/enum';
import { Column, PrimaryColumn, Table } from 'src/sql-tools';
import { SystemMetadata } from 'src/types';

@Table('system_metadata')
export class SystemMetadataTable<T extends keyof SystemMetadata = SystemMetadataKey> {
  @PrimaryColumn({ type: 'character varying' })
  key!: T;

  @Column({ type: 'jsonb' })
  value!: SystemMetadata[T];
}
