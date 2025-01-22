import { SystemConfig } from 'src/config';
import { StorageFolder, SystemMetadataKey } from 'src/enum';
import { DeepPartial } from 'src/types';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('system_metadata')
export class SystemMetadataEntity<T extends keyof SystemMetadata = SystemMetadataKey> {
  @PrimaryColumn({ type: 'varchar' })
  key!: T;

  @Column({ type: 'jsonb' })
  value!: SystemMetadata[T];
}

export type VersionCheckMetadata = { checkedAt: string; releaseVersion: string };
export type SystemFlags = { mountChecks: Record<StorageFolder, boolean> };

export interface SystemMetadata extends Record<SystemMetadataKey, Record<string, any>> {
  [SystemMetadataKey.ADMIN_ONBOARDING]: { isOnboarded: boolean };
  [SystemMetadataKey.FACIAL_RECOGNITION_STATE]: { lastRun?: string };
  [SystemMetadataKey.LICENSE]: { licenseKey: string; activationKey: string; activatedAt: Date };
  [SystemMetadataKey.REVERSE_GEOCODING_STATE]: { lastUpdate?: string; lastImportFileName?: string };
  [SystemMetadataKey.SYSTEM_CONFIG]: DeepPartial<SystemConfig>;
  [SystemMetadataKey.SYSTEM_FLAGS]: DeepPartial<SystemFlags>;
  [SystemMetadataKey.VERSION_CHECK_STATE]: VersionCheckMetadata;
}
