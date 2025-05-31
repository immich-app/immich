// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i4;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i5;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i6;
import 'package:immich_mobile/infrastructure/entities/local_asset_hash.entity.drift.dart'
    as i7;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i8;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart'
    as i9;

abstract class $Drift extends i0.GeneratedDatabase {
  $Drift(i0.QueryExecutor e) : super(e);
  $DriftManager get managers => $DriftManager(this);
  late final i1.$UserEntityTable userEntity = i1.$UserEntityTable(this);
  late final i2.$UserMetadataEntityTable userMetadataEntity =
      i2.$UserMetadataEntityTable(this);
  late final i3.$PartnerEntityTable partnerEntity =
      i3.$PartnerEntityTable(this);
  late final i4.$LocalAlbumEntityTable localAlbumEntity =
      i4.$LocalAlbumEntityTable(this);
  late final i5.$LocalAssetEntityTable localAssetEntity =
      i5.$LocalAssetEntityTable(this);
  late final i6.$LocalAlbumAssetEntityTable localAlbumAssetEntity =
      i6.$LocalAlbumAssetEntityTable(this);
  late final i7.$LocalAssetHashEntityTable localAssetHashEntity =
      i7.$LocalAssetHashEntityTable(this);
  late final i8.$RemoteAssetEntityTable remoteAssetEntity =
      i8.$RemoteAssetEntityTable(this);
  late final i9.$RemoteExifEntityTable remoteExifEntity =
      i9.$RemoteExifEntityTable(this);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [
        userEntity,
        userMetadataEntity,
        partnerEntity,
        localAlbumEntity,
        localAssetEntity,
        localAlbumAssetEntity,
        localAssetHashEntity,
        remoteAssetEntity,
        remoteExifEntity,
        i5.idxLocalAssetChecksum,
        i8.uQRemoteAssetOwnerChecksum
      ];
  @override
  i0.StreamQueryUpdateRules get streamUpdateRules =>
      const i0.StreamQueryUpdateRules(
        [
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
              i0.TableUpdate('remote_asset_entity', kind: i0.UpdateKind.delete),
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
  i2.$$UserMetadataEntityTableTableManager get userMetadataEntity =>
      i2.$$UserMetadataEntityTableTableManager(_db, _db.userMetadataEntity);
  i3.$$PartnerEntityTableTableManager get partnerEntity =>
      i3.$$PartnerEntityTableTableManager(_db, _db.partnerEntity);
  i4.$$LocalAlbumEntityTableTableManager get localAlbumEntity =>
      i4.$$LocalAlbumEntityTableTableManager(_db, _db.localAlbumEntity);
  i5.$$LocalAssetEntityTableTableManager get localAssetEntity =>
      i5.$$LocalAssetEntityTableTableManager(_db, _db.localAssetEntity);
  i6.$$LocalAlbumAssetEntityTableTableManager get localAlbumAssetEntity => i6
      .$$LocalAlbumAssetEntityTableTableManager(_db, _db.localAlbumAssetEntity);
  i7.$$LocalAssetHashEntityTableTableManager get localAssetHashEntity =>
      i7.$$LocalAssetHashEntityTableTableManager(_db, _db.localAssetHashEntity);
  i8.$$RemoteAssetEntityTableTableManager get remoteAssetEntity =>
      i8.$$RemoteAssetEntityTableTableManager(_db, _db.remoteAssetEntity);
  i9.$$RemoteExifEntityTableTableManager get remoteExifEntity =>
      i9.$$RemoteExifEntityTableTableManager(_db, _db.remoteExifEntity);
}
