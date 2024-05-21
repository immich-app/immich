import { SystemConfig } from 'src/config';
import { Column, DeepPartial, Entity, PrimaryColumn } from 'typeorm';

@Entity('system_metadata')
export class SystemMetadataEntity<T extends keyof SystemMetadata = SystemMetadataKey> {
  @PrimaryColumn({ type: 'varchar' })
  key!: T;

  @Column({ type: 'jsonb' })
  value!: SystemMetadata[T];
}

export enum SystemMetadataKey {
  REVERSE_GEOCODING_STATE = 'reverse-geocoding-state',
  ADMIN_ONBOARDING = 'admin-onboarding',
  SYSTEM_CONFIG = 'system-config',
  VERSION_CHECK_STATE = 'version-check-state',
}

export type VersionCheckMetadata = { checkedAt: string; releaseVersion: string };

export interface SystemMetadata extends Record<SystemMetadataKey, Record<string, any>> {
  [SystemMetadataKey.REVERSE_GEOCODING_STATE]: { lastUpdate?: string; lastImportFileName?: string };
  [SystemMetadataKey.ADMIN_ONBOARDING]: { isOnboarded: boolean };
  [SystemMetadataKey.SYSTEM_CONFIG]: DeepPartial<SystemConfig>;
  [SystemMetadataKey.VERSION_CHECK_STATE]: VersionCheckMetadata;
}
