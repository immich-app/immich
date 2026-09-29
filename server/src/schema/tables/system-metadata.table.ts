import { Column, PrimaryColumn, Table } from '@immich/sql-tools';
import type { SystemMetadata } from 'src/types.js';
import { SystemMetadataKey } from 'src/enum.js';

@Table('system_metadata')
export class SystemMetadataTable<T extends keyof SystemMetadata = SystemMetadataKey> {
  @PrimaryColumn({ type: 'character varying' })
  key!: T;

  @Column({ type: 'jsonb' })
  value!: SystemMetadata[T];
}
