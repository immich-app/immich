import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('system_metadata')
export class SystemMetadataEntity {
  @PrimaryColumn()
  key!: string;

  @Column({ type: 'jsonb', default: '{}', transformer: { to: JSON.stringify, from: JSON.parse } })
  value!: { [key: string]: unknown };
}

enum MetadataKey {}

export interface Metadata extends Record<MetadataKey, { [key: string]: unknown }> {}
