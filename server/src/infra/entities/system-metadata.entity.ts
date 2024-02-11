import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('system_metadata')
export class SystemMetadataEntity {
  @PrimaryColumn()
  key!: string;

  @Column({ type: 'jsonb', default: '{}', transformer: { to: JSON.stringify, from: JSON.parse } })
  value!: { [key: string]: unknown };
}

export enum SystemMetadataKey {
  REVERSE_GEOCODING_STATE = 'reverse-geocoding-state',
  ADMIN_ONBOARDING = 'admin-onboarding',
}

export interface SystemMetadata extends Record<SystemMetadataKey, { [key: string]: unknown }> {
  [SystemMetadataKey.REVERSE_GEOCODING_STATE]: { lastUpdate?: string; lastImportFileName?: string };
  [SystemMetadataKey.ADMIN_ONBOARDING]: { isOnboarded: boolean };
}
