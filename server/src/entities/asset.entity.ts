import { DeduplicateJoinsPlugin, ExpressionBuilder, Kysely, SelectQueryBuilder, sql } from 'kysely';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { DB } from 'src/db';
import { AlbumEntity } from 'src/entities/album.entity';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetFileEntity } from 'src/entities/asset-files.entity';
import { AssetJobStatusEntity } from 'src/entities/asset-job-status.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { LibraryEntity } from 'src/entities/library.entity';
import { SharedLinkEntity } from 'src/entities/shared-link.entity';
import { SmartSearchEntity } from 'src/entities/smart-search.entity';
import { StackEntity } from 'src/entities/stack.entity';
import { TagEntity } from 'src/entities/tag.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AssetFileType, AssetStatus, AssetType } from 'src/enum';
import { TimeBucketSize } from 'src/repositories/asset.repository';
import { AssetSearchBuilderOptions } from 'src/repositories/search.repository';
import { anyUuid, asUuid } from 'src/utils/database';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const ASSET_CHECKSUM_CONSTRAINT = 'UQ_assets_owner_checksum';

@Entity('assets')
// Checksums must be unique per user and library
@Index(ASSET_CHECKSUM_CONSTRAINT, ['owner', 'checksum'], {
  unique: true,
  where: '"libraryId" IS NULL',
})
@Index('UQ_assets_owner_library_checksum' + '', ['owner', 'library', 'checksum'], {
  unique: true,
  where: '"libraryId" IS NOT NULL',
})
@Index('idx_local_date_time', { synchronize: false })
@Index('idx_local_date_time_month', { synchronize: false })
@Index('IDX_originalPath_libraryId', ['originalPath', 'libraryId'])
@Index('IDX_asset_id_stackId', ['id', 'stackId'])
@Index('idx_originalFileName_trigram', { synchronize: false })
// For all assets, each originalpath must be unique per user and library
export class AssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  deviceAssetId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  owner!: UserEntity;

  @Column()
  ownerId!: string;

  @ManyToOne(() => LibraryEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  library?: LibraryEntity | null;

  @Column({ nullable: true })
  libraryId?: string | null;

  @Column()
  deviceId!: string;

  @Column()
  type!: AssetType;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.ACTIVE })
  status!: AssetStatus;

  @Column()
  originalPath!: string;

  @OneToMany(() => AssetFileEntity, (assetFile) => assetFile.asset)
  files!: AssetFileEntity[];

  @Column({ type: 'bytea', nullable: true })
  thumbhash!: Buffer | null;

  @Column({ type: 'varchar', nullable: true, default: '' })
  encodedVideoPath!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Index('idx_asset_file_created_at')
  @Column({ type: 'timestamptz' })
  fileCreatedAt!: Date;

  @Column({ type: 'timestamptz' })
  localDateTime!: Date;

  @Column({ type: 'timestamptz' })
  fileModifiedAt!: Date;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'boolean', default: false })
  isExternal!: boolean;

  @Column({ type: 'boolean', default: false })
  isOffline!: boolean;

  @Column({ type: 'bytea' })
  @Index()
  checksum!: Buffer; // sha1 checksum

  @Column({ type: 'varchar', nullable: true })
  duration!: string | null;

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean;

  @ManyToOne(() => AssetEntity, { nullable: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
  @JoinColumn()
  livePhotoVideo!: AssetEntity | null;

  @Column({ nullable: true })
  livePhotoVideoId!: string | null;

  @Column({ type: 'varchar' })
  @Index()
  originalFileName!: string;

  @Column({ type: 'varchar', nullable: true })
  sidecarPath!: string | null;

  @OneToOne(() => ExifEntity, (exifEntity) => exifEntity.asset)
  exifInfo?: ExifEntity;

  @OneToOne(() => SmartSearchEntity, (smartSearchEntity) => smartSearchEntity.asset)
  smartSearch?: SmartSearchEntity;

  @ManyToMany(() => TagEntity, (tag) => tag.assets, { cascade: true })
  @JoinTable({ name: 'tag_asset', synchronize: false })
  tags!: TagEntity[];

  @ManyToMany(() => SharedLinkEntity, (link) => link.assets, { cascade: true })
  @JoinTable({ name: 'shared_link__asset' })
  sharedLinks!: SharedLinkEntity[];

  @ManyToMany(() => AlbumEntity, (album) => album.assets, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  albums?: AlbumEntity[];

  @OneToMany(() => AssetFaceEntity, (assetFace) => assetFace.asset)
  faces!: AssetFaceEntity[];

  @Column({ nullable: true })
  stackId?: string | null;

  @ManyToOne(() => StackEntity, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn()
  stack?: StackEntity | null;

  @OneToOne(() => AssetJobStatusEntity, (jobStatus) => jobStatus.asset, { nullable: true })
  jobStatus?: AssetJobStatusEntity;

  @Index('IDX_assets_duplicateId')
  @Column({ type: 'uuid', nullable: true })
  duplicateId!: string | null;
}

export function withExif<O>(qb: SelectQueryBuilder<DB, 'assets', O>) {
  return qb.leftJoin('exif', 'assets.id', 'exif.assetId').select((eb) => eb.fn.toJson(eb.table('exif')).as('exifInfo'));
}

export function withExifInner<O>(qb: SelectQueryBuilder<DB, 'assets', O>) {
  return qb
    .innerJoin('exif', 'assets.id', 'exif.assetId')
    .select((eb) => eb.fn.toJson(eb.table('exif')).as('exifInfo'));
}

export function withSmartSearch<O>(qb: SelectQueryBuilder<DB, 'assets', O>) {
  return qb
    .leftJoin('smart_search', 'assets.id', 'smart_search.assetId')
    .select((eb) => eb.fn.toJson(eb.table('smart_search')).as('smartSearch'));
}

export function withFaces(eb: ExpressionBuilder<DB, 'assets'>) {
  return jsonArrayFrom(eb.selectFrom('asset_faces').selectAll().whereRef('asset_faces.assetId', '=', 'assets.id')).as(
    'faces',
  );
}

export function withFiles(eb: ExpressionBuilder<DB, 'assets'>, type?: AssetFileType) {
  return jsonArrayFrom(
    eb
      .selectFrom('asset_files')
      .selectAll()
      .whereRef('asset_files.assetId', '=', 'assets.id')
      .$if(!!type, (qb) => qb.where('type', '=', type!)),
  ).as('files');
}

export function withFacesAndPeople(eb: ExpressionBuilder<DB, 'assets'>) {
  return eb
    .selectFrom('asset_faces')
    .leftJoin('person', 'person.id', 'asset_faces.personId')
    .whereRef('asset_faces.assetId', '=', 'assets.id')
    .select((eb) =>
      eb
        .fn('jsonb_agg', [
          eb
            .case()
            .when('person.id', 'is not', null)
            .then(
              eb.fn('jsonb_insert', [
                eb.fn('to_jsonb', [eb.table('asset_faces')]),
                sql`'{person}'::text[]`,
                eb.fn('to_jsonb', [eb.table('person')]),
              ]),
            )
            .else(eb.fn('to_jsonb', [eb.table('asset_faces')]))
            .end(),
        ])
        .as('faces'),
    )
    .as('faces');
}

export function hasPeople<O>(qb: SelectQueryBuilder<DB, 'assets', O>, personIds: string[]) {
  return qb.innerJoin(
    (eb) =>
      eb
        .selectFrom('asset_faces')
        .select('assetId')
        .where('personId', '=', anyUuid(personIds!))
        .groupBy('assetId')
        .having((eb) => eb.fn.count('personId').distinct(), '=', personIds.length)
        .as('has_people'),
    (join) => join.onRef('has_people.assetId', '=', 'assets.id'),
  );
}

export function hasTags<O>(qb: SelectQueryBuilder<DB, 'assets', O>, tagIds: string[]) {
  return qb.innerJoin(
    (eb) =>
      eb
        .selectFrom('tag_asset')
        .select('assetsId')
        .innerJoin('tags_closure', 'tag_asset.tagsId', 'tags_closure.id_descendant')
        .where('tags_closure.id_ancestor', '=', anyUuid(tagIds))
        .groupBy('assetsId')
        .having((eb) => eb.fn.count('tags_closure.id_ancestor').distinct(), '>=', tagIds.length)
        .as('has_tags'),
    (join) => join.onRef('has_tags.assetsId', '=', 'assets.id'),
  );
}

export function withOwner(eb: ExpressionBuilder<DB, 'assets'>) {
  return jsonObjectFrom(eb.selectFrom('users').selectAll().whereRef('users.id', '=', 'assets.ownerId')).as('owner');
}

export function withLibrary(eb: ExpressionBuilder<DB, 'assets'>) {
  return jsonObjectFrom(eb.selectFrom('libraries').selectAll().whereRef('libraries.id', '=', 'assets.libraryId')).as(
    'library',
  );
}

export function withAlbums<O>(qb: SelectQueryBuilder<DB, 'assets', O>, { albumId }: { albumId?: string }) {
  return qb
    .select((eb) =>
      jsonArrayFrom(
        eb
          .selectFrom('albums')
          .selectAll()
          .innerJoin('albums_assets_assets', (join) =>
            join
              .onRef('albums.id', '=', 'albums_assets_assets.albumsId')
              .onRef('assets.id', '=', 'albums_assets_assets.assetsId'),
          )
          .whereRef('albums.id', '=', 'albums_assets_assets.albumsId')
          .$if(!!albumId, (qb) => qb.where('albums.id', '=', asUuid(albumId!))),
      ).as('albums'),
    )
    .$if(!!albumId, (qb) =>
      qb.where((eb) =>
        eb.exists((eb) =>
          eb
            .selectFrom('albums_assets_assets')
            .whereRef('albums_assets_assets.assetsId', '=', 'assets.id')
            .where('albums_assets_assets.albumsId', '=', asUuid(albumId!)),
        ),
      ),
    );
}

export function withTags(eb: ExpressionBuilder<DB, 'assets'>) {
  return jsonArrayFrom(
    eb
      .selectFrom('tags')
      .selectAll('tags')
      .innerJoin('tag_asset', 'tags.id', 'tag_asset.tagsId')
      .whereRef('assets.id', '=', 'tag_asset.assetsId'),
  ).as('tags');
}

export function truncatedDate<O>(size: TimeBucketSize) {
  return sql<O>`date_trunc(${size}, "localDateTime" at time zone 'UTC') at time zone 'UTC'`;
}

export function withTagId<O>(qb: SelectQueryBuilder<DB, 'assets', O>, tagId: string) {
  return qb.where((eb) =>
    eb.exists(
      eb
        .selectFrom('tags_closure')
        .innerJoin('tag_asset', 'tag_asset.tagsId', 'tags_closure.id_descendant')
        .whereRef('tag_asset.assetsId', '=', 'assets.id')
        .where('tags_closure.id_ancestor', '=', tagId),
    ),
  );
}

const joinDeduplicationPlugin = new DeduplicateJoinsPlugin();

/** TODO: This should only be used for search-related queries, not as a general purpose query builder */
export function searchAssetBuilder(kysely: Kysely<DB>, options: AssetSearchBuilderOptions) {
  options.isArchived ??= options.withArchived ? undefined : false;
  options.withDeleted ||= !!(options.trashedAfter || options.trashedBefore);
  return kysely
    .withPlugin(joinDeduplicationPlugin)
    .selectFrom('assets')
    .selectAll('assets')
    .$if(!!options.tagIds && options.tagIds.length > 0, (qb) => hasTags(qb, options.tagIds!))
    .$if(!!options.personIds && options.personIds.length > 0, (qb) => hasPeople(qb, options.personIds!))
    .$if(!!options.createdBefore, (qb) => qb.where('assets.createdAt', '<=', options.createdBefore!))
    .$if(!!options.createdAfter, (qb) => qb.where('assets.createdAt', '>=', options.createdAfter!))
    .$if(!!options.updatedBefore, (qb) => qb.where('assets.updatedAt', '<=', options.updatedBefore!))
    .$if(!!options.updatedAfter, (qb) => qb.where('assets.updatedAt', '>=', options.updatedAfter!))
    .$if(!!options.trashedBefore, (qb) => qb.where('assets.deletedAt', '<=', options.trashedBefore!))
    .$if(!!options.trashedAfter, (qb) => qb.where('assets.deletedAt', '>=', options.trashedAfter!))
    .$if(!!options.takenBefore, (qb) => qb.where('assets.fileCreatedAt', '<=', options.takenBefore!))
    .$if(!!options.takenAfter, (qb) => qb.where('assets.fileCreatedAt', '>=', options.takenAfter!))
    .$if(options.city !== undefined, (qb) =>
      qb
        .innerJoin('exif', 'assets.id', 'exif.assetId')
        .where('exif.city', options.city === null ? 'is' : '=', options.city!),
    )
    .$if(options.state !== undefined, (qb) =>
      qb
        .innerJoin('exif', 'assets.id', 'exif.assetId')
        .where('exif.state', options.state === null ? 'is' : '=', options.state!),
    )
    .$if(options.country !== undefined, (qb) =>
      qb
        .innerJoin('exif', 'assets.id', 'exif.assetId')
        .where('exif.country', options.country === null ? 'is' : '=', options.country!),
    )
    .$if(options.make !== undefined, (qb) =>
      qb
        .innerJoin('exif', 'assets.id', 'exif.assetId')
        .where('exif.make', options.make === null ? 'is' : '=', options.make!),
    )
    .$if(options.model !== undefined, (qb) =>
      qb
        .innerJoin('exif', 'assets.id', 'exif.assetId')
        .where('exif.model', options.model === null ? 'is' : '=', options.model!),
    )
    .$if(options.lensModel !== undefined, (qb) =>
      qb
        .innerJoin('exif', 'assets.id', 'exif.assetId')
        .where('exif.lensModel', options.lensModel === null ? 'is' : '=', options.lensModel!),
    )
    .$if(!!options.checksum, (qb) => qb.where('assets.checksum', '=', options.checksum!))
    .$if(!!options.deviceAssetId, (qb) => qb.where('assets.deviceAssetId', '=', options.deviceAssetId!))
    .$if(!!options.deviceId, (qb) => qb.where('assets.deviceId', '=', options.deviceId!))
    .$if(!!options.id, (qb) => qb.where('assets.id', '=', asUuid(options.id!)))
    .$if(!!options.libraryId, (qb) => qb.where('assets.libraryId', '=', asUuid(options.libraryId!)))
    .$if(!!options.userIds, (qb) => qb.where('assets.ownerId', '=', anyUuid(options.userIds!)))
    .$if(!!options.encodedVideoPath, (qb) => qb.where('assets.encodedVideoPath', '=', options.encodedVideoPath!))
    .$if(!!options.originalPath, (qb) => qb.where('assets.originalPath', '=', options.originalPath!))
    .$if(!!options.originalFileName, (qb) =>
      qb.where(
        sql`f_unaccent(assets."originalFileName")`,
        'ilike',
        sql`'%' || f_unaccent(${options.originalFileName}) || '%'`,
      ),
    )
    .$if(!!options.description, (qb) =>
      qb
        .innerJoin('exif', 'assets.id', 'exif.assetId')
        .where(sql`f_unaccent(exif.description)`, 'ilike', sql`'%' || f_unaccent(${options.description}) || '%'`),
    )
    .$if(!!options.type, (qb) => qb.where('assets.type', '=', options.type!))
    .$if(options.isFavorite !== undefined, (qb) => qb.where('assets.isFavorite', '=', options.isFavorite!))
    .$if(options.isOffline !== undefined, (qb) => qb.where('assets.isOffline', '=', options.isOffline!))
    .$if(options.isVisible !== undefined, (qb) => qb.where('assets.isVisible', '=', options.isVisible!))
    .$if(options.isArchived !== undefined, (qb) => qb.where('assets.isArchived', '=', options.isArchived!))
    .$if(options.isEncoded !== undefined, (qb) =>
      qb.where('assets.encodedVideoPath', options.isEncoded ? 'is not' : 'is', null),
    )
    .$if(options.isMotion !== undefined, (qb) =>
      qb.where('assets.livePhotoVideoId', options.isMotion ? 'is not' : 'is', null),
    )
    .$if(!!options.isNotInAlbum, (qb) =>
      qb.where((eb) =>
        eb.not(eb.exists((eb) => eb.selectFrom('albums_assets_assets').whereRef('assetsId', '=', 'assets.id'))),
      ),
    )
    .$if(!!options.withExif, withExifInner)
    .$if(!!(options.withFaces || options.withPeople || options.personIds), (qb) => qb.select(withFacesAndPeople))
    .$if(!options.withDeleted, (qb) => qb.where('assets.deletedAt', 'is', null));
}
