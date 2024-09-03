import { SystemConfig } from 'src/config';
import { SystemMetadataKey } from 'src/enum';
import { Column, DeepPartial, Entity, PrimaryColumn } from 'typeorm';

@Entity('system_metadata')
export class SystemMetadataEntity<T extends keyof SystemMetadata = SystemMetadataKey> {
  @PrimaryColumn({ type: 'varchar' })
  key!: T;

  @Column({ type: 'jsonb' })
  value!: SystemMetadata[T];
}

export type VersionCheckMetadata = { checkedAt: string; releaseVersion: string };

export interface SystemMetadata extends Record<SystemMetadataKey, Record<string, any>> {
  [SystemMetadataKey.REVERSE_GEOCODING_STATE]: { lastUpdate?: string; lastImportFileName?: string };
  [SystemMetadataKey.FACIAL_RECOGNITION_STATE]: { lastRun?: string };
  [SystemMetadataKey.ADMIN_ONBOARDING]: { isOnboarded: boolean };
  [SystemMetadataKey.SYSTEM_CONFIG]: DeepPartial<SystemConfig>;
  [SystemMetadataKey.VERSION_CHECK_STATE]: VersionCheckMetadata;
  [SystemMetadataKey.LICENSE]: { licenseKey: string; activationKey: string; activatedAt: Date };
}
