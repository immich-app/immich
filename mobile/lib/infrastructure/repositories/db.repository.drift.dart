// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart'
    as i4;
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart'
    as i5;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i6;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i7;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart'
    as i8;

abstract class $Drift extends i0.GeneratedDatabase {
  $Drift(i0.QueryExecutor e) : super(e);
  $DriftManager get managers => $DriftManager(this);
  late final i1.$UserEntityTable userEntity = i1.$UserEntityTable(this);
  late final i2.$RemoteAssetEntityTable remoteAssetEntity =
      i2.$RemoteAssetEntityTable(this);
  late final i3.$LocalAssetEntityTable localAssetEntity =
      i3.$LocalAssetEntityTable(this);
  late final i4.$UserMetadataEntityTable userMetadataEntity =
      i4.$UserMetadataEntityTable(this);
  late final i5.$PartnerEntityTable partnerEntity =
      i5.$PartnerEntityTable(this);
  late final i6.$LocalAlbumEntityTable localAlbumEntity =
      i6.$LocalAlbumEntityTable(this);
  late final i7.$LocalAlbumAssetEntityTable localAlbumAssetEntity =
      i7.$LocalAlbumAssetEntityTable(this);
  late final i8.$RemoteExifEntityTable remoteExifEntity =
      i8.$RemoteExifEntityTable(this);
  late final i9.$RemoteAlbumEntityTable remoteAlbumEntity =
      i9.$RemoteAlbumEntityTable(this);
  late final i10.$RemoteAlbumAssetEntityTable remoteAlbumAssetEntity =
      i10.$RemoteAlbumAssetEntityTable(this);
  late final i11.$AlbumUserEntityTable albumUserEntity =
      i11.$AlbumUserEntityTable(this);
  i12.MergedAssetDrift get mergedAssetDrift => i13.ReadDatabaseContainer(this)
      .accessor<i12.MergedAssetDrift>(i12.MergedAssetDrift.new);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [
        userEntity,
        remoteAssetEntity,
        localAssetEntity,
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
  i4.$$UserMetadataEntityTableTableManager get userMetadataEntity =>
      i4.$$UserMetadataEntityTableTableManager(_db, _db.userMetadataEntity);
  i5.$$PartnerEntityTableTableManager get partnerEntity =>
      i5.$$PartnerEntityTableTableManager(_db, _db.partnerEntity);
  i6.$$LocalAlbumEntityTableTableManager get localAlbumEntity =>
      i6.$$LocalAlbumEntityTableTableManager(_db, _db.localAlbumEntity);
  i7.$$LocalAlbumAssetEntityTableTableManager get localAlbumAssetEntity => i7
      .$$LocalAlbumAssetEntityTableTableManager(_db, _db.localAlbumAssetEntity);
  i8.$$RemoteExifEntityTableTableManager get remoteExifEntity =>
      i8.$$RemoteExifEntityTableTableManager(_db, _db.remoteExifEntity);
}
