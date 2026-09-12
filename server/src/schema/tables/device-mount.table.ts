import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  type Generated,
  PrimaryGeneratedColumn,
  Table,
  type Timestamp,
  Unique,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger } from 'src/decorators.js';
import { LibraryTable } from 'src/schema/tables/library.table.js';

/**
 * Tracks which removable/external drive backs a given library, independent of the filesystem path the OS
 * happens to mount it at on any given connection. Written/read by DeviceResolverService's integration with the
 * library-scan job (Phase 1, work items 3-4 of the PhotoManager plan) - see device-resolver.service.ts for how
 * `volumeId` is derived.
 *
 * NOTE: this schema file is hand-written to match the project's existing table conventions, but the migration
 * that creates this table in Postgres still needs to be generated with `pnpm migrations:generate` against a real
 * dev database - that step needs a live Immich Postgres instance, which wasn't available when this was drafted.
 */
@Table('device_mount')
@UpdatedAtTrigger('device_mount_updatedAt')
@Unique({ name: 'UQ_device_mount_volumeId', columns: ['volumeId'] })
export class DeviceMountTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => LibraryTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  libraryId!: string;

  /** Normalized DeviceIdentity.id from DeviceResolverService - stable across reconnects and across OSes. */
  @Column()
  volumeId!: string;

  /** DeviceIdentityMethod at the time of the last successful match (e.g. 'filesystem-serial'). */
  @Column()
  identityMethod!: string;

  /** DeviceIdentityConfidence at the time of the last successful match (e.g. 'high'). */
  @Column()
  identityConfidence!: string;

  /** Where the OS mounted this drive as of the last scan - a drive letter or a mount path, not assumed stable. */
  @Column()
  lastKnownPath!: string;

  @Column({ type: 'timestamp with time zone' })
  lastSeenAt!: Timestamp;

  /** Cached for the admin-UI indicator; recomputing it from the asset table on every page load is unnecessary. */
  @Column({ type: 'integer', nullable: true })
  assetCount!: number | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Date>;
}
