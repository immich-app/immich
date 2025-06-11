// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/merged_asset.view.drift.dart'
    as i4;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart'
    as i5;
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart'
    as i6;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i7;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i8;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart'
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
  late final i3.$LocalAssetEntityTable localAssetEntity =
      i3.$LocalAssetEntityTable(this);
  late final i4.MergedAssetView mergedAssetView = i4.MergedAssetView(this);
  late final i5.$UserMetadataEntityTable userMetadataEntity =
      i5.$UserMetadataEntityTable(this);
  late final i6.$PartnerEntityTable partnerEntity =
      i6.$PartnerEntityTable(this);
  late final i7.$LocalAlbumEntityTable localAlbumEntity =
      i7.$LocalAlbumEntityTable(this);
  late final i8.$LocalAlbumAssetEntityTable localAlbumAssetEntity =
      i8.$LocalAlbumAssetEntityTable(this);
  late final i9.$RemoteExifEntityTable remoteExifEntity =
      i9.$RemoteExifEntityTable(this);
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
        localAssetEntity,
        mergedAssetView,
        i3.idxLocalAssetChecksum,
        i2.uQRemoteAssetOwnerChecksum,
        i2.idxRemoteAssetChecksum,
        userMetadataEntity,
        partnerEntity,
        localAlbumEntity,
        localAlbumAssetEntity,
        remoteExifEntity,
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
            on: i0.TableUpdateQuery.onTableName('remote_asset_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('remote_exif_entity', kind: i0.UpdateKind.delete),
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
  i3.$$LocalAssetEntityTableTableManager get localAssetEntity =>
      i3.$$LocalAssetEntityTableTableManager(_db, _db.localAssetEntity);
  i5.$$UserMetadataEntityTableTableManager get userMetadataEntity =>
      i5.$$UserMetadataEntityTableTableManager(_db, _db.userMetadataEntity);
  i6.$$PartnerEntityTableTableManager get partnerEntity =>
      i6.$$PartnerEntityTableTableManager(_db, _db.partnerEntity);
  i7.$$LocalAlbumEntityTableTableManager get localAlbumEntity =>
      i7.$$LocalAlbumEntityTableTableManager(_db, _db.localAlbumEntity);
  i8.$$LocalAlbumAssetEntityTableTableManager get localAlbumAssetEntity => i8
      .$$LocalAlbumAssetEntityTableTableManager(_db, _db.localAlbumAssetEntity);
  i9.$$RemoteExifEntityTableTableManager get remoteExifEntity =>
      i9.$$RemoteExifEntityTableTableManager(_db, _db.remoteExifEntity);
  i10.$$RemoteAlbumEntityTableTableManager get remoteAlbumEntity =>
      i10.$$RemoteAlbumEntityTableTableManager(_db, _db.remoteAlbumEntity);
  i11.$$RemoteAlbumAssetEntityTableTableManager get remoteAlbumAssetEntity =>
      i11.$$RemoteAlbumAssetEntityTableTableManager(
          _db, _db.remoteAlbumAssetEntity);
  i12.$$AlbumUserEntityTableTableManager get albumUserEntity =>
      i12.$$AlbumUserEntityTableTableManager(_db, _db.albumUserEntity);
}
