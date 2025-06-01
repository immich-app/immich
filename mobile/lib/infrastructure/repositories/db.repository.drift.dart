// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/trigger.drift.dart' as i4;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i5;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart'
    as i6;
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart'
    as i7;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i8;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i9;
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart'
    as i10;
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart'
    as i11;
import 'package:immich_mobile/infrastructure/entities/album_user.entity.drift.dart'
    as i12;

abstract class $Drift extends i0.GeneratedDatabase {
  $Drift(i0.QueryExecutor e) : super(e);
  $DriftManager get managers => $DriftManager(this);
  late final i1.$UserEntityTable userEntity = i1.$UserEntityTable(this);
  late final i2.$RemoteAssetEntityTable remoteAssetEntity =
      i2.$RemoteAssetEntityTable(this);
  late final i3.$ExifEntityTable exifEntity = i3.$ExifEntityTable(this);
  late final i5.$LocalAssetEntityTable localAssetEntity =
      i5.$LocalAssetEntityTable(this);
  late final i6.$UserMetadataEntityTable userMetadataEntity =
      i6.$UserMetadataEntityTable(this);
  late final i7.$PartnerEntityTable partnerEntity =
      i7.$PartnerEntityTable(this);
  late final i8.$LocalAlbumEntityTable localAlbumEntity =
      i8.$LocalAlbumEntityTable(this);
  late final i9.$LocalAlbumAssetEntityTable localAlbumAssetEntity =
      i9.$LocalAlbumAssetEntityTable(this);
  late final i10.$RemoteAlbumEntityTable remoteAlbumEntity =
      i10.$RemoteAlbumEntityTable(this);
  late final i11.$RemoteAlbumAssetEntityTable remoteAlbumAssetEntity =
      i11.$RemoteAlbumAssetEntityTable(this);
  late final i12.$AlbumUserEntityTable albumUserEntity =
      i12.$AlbumUserEntityTable(this);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [
        userEntity,
        remoteAssetEntity,
        exifEntity,
        i4.trRemoteAssetDeleteCascade,
        localAssetEntity,
        i4.trLocalAssetDeleteCascade,
        i5.idxLocalAssetChecksum,
        i2.uQRemoteAssetOwnerChecksum,
        userMetadataEntity,
        partnerEntity,
        localAlbumEntity,
        localAlbumAssetEntity,
        remoteAlbumEntity,
        remoteAlbumAssetEntity,
        albumUserEntity
      ];
  @override
  i0.StreamQueryUpdateRules get streamUpdateRules =>
      const i0.StreamQueryUpdateRules(
        [
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('user_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('remote_asset_entity', kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('remote_asset_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('exif_entity', kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('local_asset_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('exif_entity', kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('user_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('user_metadata_entity',
                  kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('user_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('partner_entity', kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('user_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('partner_entity', kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('local_asset_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('local_album_asset_entity',
                  kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('local_album_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('local_album_asset_entity',
                  kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('user_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('remote_album_entity', kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('remote_asset_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('remote_album_entity', kind: i0.UpdateKind.update),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('remote_asset_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('remote_album_asset_entity',
                  kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('remote_album_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('remote_album_asset_entity',
                  kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('remote_album_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('album_user_entity', kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('user_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('album_user_entity', kind: i0.UpdateKind.delete),
            ],
          ),
        ],
      );
  @override
  i0.DriftDatabaseOptions get options =>
      const i0.DriftDatabaseOptions(storeDateTimeAsText: true);
}

class $DriftManager {
  final $Drift _db;
  $DriftManager(this._db);
  i1.$$UserEntityTableTableManager get userEntity =>
      i1.$$UserEntityTableTableManager(_db, _db.userEntity);
  i2.$$RemoteAssetEntityTableTableManager get remoteAssetEntity =>
      i2.$$RemoteAssetEntityTableTableManager(_db, _db.remoteAssetEntity);
  i3.$$ExifEntityTableTableManager get exifEntity =>
      i3.$$ExifEntityTableTableManager(_db, _db.exifEntity);
  i5.$$LocalAssetEntityTableTableManager get localAssetEntity =>
      i5.$$LocalAssetEntityTableTableManager(_db, _db.localAssetEntity);
  i6.$$UserMetadataEntityTableTableManager get userMetadataEntity =>
      i6.$$UserMetadataEntityTableTableManager(_db, _db.userMetadataEntity);
  i7.$$PartnerEntityTableTableManager get partnerEntity =>
      i7.$$PartnerEntityTableTableManager(_db, _db.partnerEntity);
  i8.$$LocalAlbumEntityTableTableManager get localAlbumEntity =>
      i8.$$LocalAlbumEntityTableTableManager(_db, _db.localAlbumEntity);
  i9.$$LocalAlbumAssetEntityTableTableManager get localAlbumAssetEntity => i9
      .$$LocalAlbumAssetEntityTableTableManager(_db, _db.localAlbumAssetEntity);
  i10.$$RemoteAlbumEntityTableTableManager get remoteAlbumEntity =>
      i10.$$RemoteAlbumEntityTableTableManager(_db, _db.remoteAlbumEntity);
  i11.$$RemoteAlbumAssetEntityTableTableManager get remoteAlbumAssetEntity =>
      i11.$$RemoteAlbumAssetEntityTableTableManager(
          _db, _db.remoteAlbumAssetEntity);
  i12.$$AlbumUserEntityTableTableManager get albumUserEntity =>
      i12.$$AlbumUserEntityTableTableManager(_db, _db.albumUserEntity);
}
