// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/asset_triggers.drift.dart'
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
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.drift.dart'
    as i12;
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart'
    as i13;
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.drift.dart'
    as i14;
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart'
    as i15;
import 'package:immich_mobile/infrastructure/entities/merged_asset.drift.dart'
    as i16;
import 'package:drift/internal/modular.dart' as i17;

abstract class $Drift extends i0.GeneratedDatabase {
  $Drift(i0.QueryExecutor e) : super(e);
  $DriftManager get managers => $DriftManager(this);
  late final i1.$UserEntityTable userEntity = i1.$UserEntityTable(this);
  late final i2.$RemoteAssetEntityTable remoteAssetEntity =
      i2.$RemoteAssetEntityTable(this);
  late final i3.$LocalAssetEntityTable localAssetEntity =
      i3.$LocalAssetEntityTable(this);
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
  late final i12.$RemoteAlbumUserEntityTable remoteAlbumUserEntity =
      i12.$RemoteAlbumUserEntityTable(this);
  late final i13.$MemoryEntityTable memoryEntity = i13.$MemoryEntityTable(this);
  late final i14.$MemoryAssetEntityTable memoryAssetEntity =
      i14.$MemoryAssetEntityTable(this);
  late final i15.$StackEntityTable stackEntity = i15.$StackEntityTable(this);
  i16.MergedAssetDrift get mergedAssetDrift => i17.ReadDatabaseContainer(this)
      .accessor<i16.MergedAssetDrift>(i16.MergedAssetDrift.new);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [
        userEntity,
        remoteAssetEntity,
        localAssetEntity,
        i4.trLocalAssetUpdateChecksumSetIds,
        i4.trLocalAssetUpdateOldChecksumSetRemoteAssetLocalId,
        i4.trLocalAssetDeleteUpdateRemoteAssetLocalId,
        i4.trRemoteAssetInsertSetLocalId,
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
        remoteAlbumUserEntity,
        memoryEntity,
        memoryAssetEntity,
        stackEntity
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
              i0.TableUpdate('local_asset_entity', kind: i0.UpdateKind.update),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('local_asset_entity',
                limitUpdateKind: i0.UpdateKind.update),
            result: [
              i0.TableUpdate('local_asset_entity', kind: i0.UpdateKind.update),
              i0.TableUpdate('remote_asset_entity', kind: i0.UpdateKind.update),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('local_asset_entity',
                limitUpdateKind: i0.UpdateKind.update),
            result: [
              i0.TableUpdate('remote_asset_entity', kind: i0.UpdateKind.update),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('local_asset_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('remote_asset_entity', kind: i0.UpdateKind.update),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('remote_asset_entity',
                limitUpdateKind: i0.UpdateKind.insert),
            result: [
              i0.TableUpdate('remote_asset_entity', kind: i0.UpdateKind.update),
              i0.TableUpdate('local_asset_entity', kind: i0.UpdateKind.update),
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
              i0.TableUpdate('remote_album_user_entity',
                  kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('user_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('remote_album_user_entity',
                  kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('user_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('memory_entity', kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('remote_asset_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('memory_asset_entity', kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('memory_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('memory_asset_entity', kind: i0.UpdateKind.delete),
            ],
          ),
          i0.WritePropagation(
            on: i0.TableUpdateQuery.onTableName('user_entity',
                limitUpdateKind: i0.UpdateKind.delete),
            result: [
              i0.TableUpdate('stack_entity', kind: i0.UpdateKind.delete),
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
  i12.$$RemoteAlbumUserEntityTableTableManager get remoteAlbumUserEntity => i12
      .$$RemoteAlbumUserEntityTableTableManager(_db, _db.remoteAlbumUserEntity);
  i13.$$MemoryEntityTableTableManager get memoryEntity =>
      i13.$$MemoryEntityTableTableManager(_db, _db.memoryEntity);
  i14.$$MemoryAssetEntityTableTableManager get memoryAssetEntity =>
      i14.$$MemoryAssetEntityTableTableManager(_db, _db.memoryAssetEntity);
  i15.$$StackEntityTableTableManager get stackEntity =>
      i15.$$StackEntityTableTableManager(_db, _db.stackEntity);
}
