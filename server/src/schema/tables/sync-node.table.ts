import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { SyncNodeStatus } from 'src/enum';
import { AlbumTable } from 'src/schema/tables/album.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { UserTable } from 'src/schema/tables/user.table';

/** Another Immich instance this one is paired with. */
@Table('sync_node')
@UpdatedAtTrigger('sync_node_updatedAt')
@Unique({ columns: ['name'] })
export class SyncNodeTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @Column()
  name!: string;

  /** Base URL of the peer, e.g. https://immich.example.com */
  @Column()
  url!: string;

  /** API key for the peer. Never returned by the API. */
  @Column()
  apiKey!: string;

  @Column({ type: 'boolean', default: true })
  isEnabled!: Generated<boolean>;

  @Column({ default: SyncNodeStatus.Unknown })
  status!: Generated<SyncNodeStatus>;

  @Column({ type: 'character varying', nullable: true, default: null })
  remoteVersion!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  lastCheckedAt!: Timestamp | null;

  @Column({ type: 'character varying', nullable: true, default: null })
  error!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}

/**
 * Pairs a local user with a user on the peer. Every asset and album mapping
 * hangs off one of these, so unpairing cleanly forgets everything about that
 * relationship without touching either library.
 */
@Table('sync_node_user')
@UpdatedAtTrigger('sync_node_user_updatedAt')
@Unique({ columns: ['nodeId', 'localUserId'] })
export class SyncNodeUserTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => SyncNodeTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', index: false })
  nodeId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  localUserId!: string;

  /** The paired user's id on the peer. */
  @Column({ type: 'uuid' })
  remoteUserId!: string;

  @Column()
  remoteUserEmail!: string;

  /**
   * An API key belonging to the paired user on the peer, not to its admin.
   *
   * Asset endpoints act as whoever owns the key: uploading with an admin key
   * puts the asset in the admin's library and searching with it cannot see
   * another user's assets. Moving data therefore has to use the paired user's
   * own key. Never returned by the API.
   */
  @Column()
  apiKey!: string;

  @Column({ type: 'boolean', default: true })
  pushEnabled!: Generated<boolean>;

  @Column({ type: 'boolean', default: true })
  pullEnabled!: Generated<boolean>;

  /**
   * Watermark for local -> remote. Assets are ordered by the UUIDv7 `updateId`,
   * so this is a resumable cursor over everything that has changed locally.
   */
  @Column({ type: 'uuid', nullable: true, default: null })
  pushCursor!: string | null;

  /**
   * Watermark for remote -> local. The peer is queried through its public search
   * API, which filters on `updatedAfter`, so this side is a timestamp.
   */
  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  pullCursor!: Timestamp | null;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  lastSyncedAt!: Timestamp | null;

  @Column({ type: 'character varying', nullable: true, default: null })
  error!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}

/**
 * Identity map between a local asset and its counterpart on the peer. This is
 * what stops an asset bouncing back and forth: an asset that arrived by pull is
 * already mapped, so the next push skips it.
 */
@Table('sync_node_asset')
@Unique({ columns: ['nodeUserId', 'localAssetId'] })
@Unique({ columns: ['nodeUserId', 'remoteAssetId'] })
export class SyncNodeAssetTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => SyncNodeUserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', index: false })
  nodeUserId!: string;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  localAssetId!: string;

  @Column({ type: 'uuid' })
  remoteAssetId!: string;

  @Column({ type: 'bytea' })
  checksum!: Buffer;

  /** How this pairing first came about, kept for troubleshooting. */
  @Column()
  origin!: string;

  /** Local `updateId` at the time metadata was last pushed, to avoid redundant updates. */
  @Column({ type: 'uuid', nullable: true, default: null })
  metadataUpdateId!: string | null;

  /**
   * When the trashed/untrashed state was last reconciled with the peer.
   *
   * Trashing is a soft delete, so the asset row -- and therefore this mapping --
   * still exists while it sits in the bin. That window is what makes propagating
   * a deletion possible at all: once the asset is hard-deleted this row cascades
   * away, by which point the peer has already been told.
   */
  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  trashSyncedAt!: Timestamp | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}

/** Identity map between a local album and its counterpart on the peer. */
@Table('sync_node_album')
@Unique({ columns: ['nodeUserId', 'localAlbumId'] })
@Unique({ columns: ['nodeUserId', 'remoteAlbumId'] })
export class SyncNodeAlbumTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => SyncNodeUserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', index: false })
  nodeUserId!: string;

  @ForeignKeyColumn(() => AlbumTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  localAlbumId!: string;

  @Column({ type: 'uuid' })
  remoteAlbumId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
