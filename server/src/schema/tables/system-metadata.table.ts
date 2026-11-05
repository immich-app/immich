import { Column, PrimaryColumn, Table } from '@immich/sql-tools';
import { SystemMetadataKey } from 'src/enum.js';
import type { SystemMetadata } from 'src/types.js';

@Table('system_metadata')
export class SystemMetadataTable<T extends keyof SystemMetadata = SystemMetadataKey> {
  @PrimaryColumn({ type: 'character varying' })
  key!: T;

  @Column({ type: 'jsonb' })
  value!: SystemMetadata[T];
}
