// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/upload_tasks.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart'
    as i4;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i5;
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart'
    as i6;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i7;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i8;
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart'
    as i9;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart'
    as i10;
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart'
    as i11;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart'
    as i12;
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart'
    as i13;
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.drift.dart'
    as i14;
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart'
    as i15;
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.drift.dart'
    as i16;
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart'
    as i17;
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart'
    as i18;
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart'
    as i19;
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart'
    as i20;
import 'package:immich_mobile/infrastructure/entities/merged_asset.drift.dart'
    as i21;
import 'package:drift/internal/modular.dart' as i22;

abstract class $Drift extends i0.GeneratedDatabase {
  $Drift(i0.QueryExecutor e) : super(e);
  $DriftManager get managers => $DriftManager(this);
  late final i1.UploadTasks uploadTasks = i1.UploadTasks(this);
  late final i1.UploadTaskStats uploadTaskStats = i1.UploadTaskStats(this);
  late final i2.$UserEntityTable userEntity = i2.$UserEntityTable(this);
  late final i3.$RemoteAssetEntityTable remoteAssetEntity = i3
      .$RemoteAssetEntityTable(this);
  late final i4.$StackEntityTable stackEntity = i4.$StackEntityTable(this);
  late final i5.$LocalAssetEntityTable localAssetEntity = i5
      .$LocalAssetEntityTable(this);
  late final i6.$RemoteAlbumEntityTable remoteAlbumEntity = i6
      .$RemoteAlbumEntityTable(this);
  late final i7.$LocalAlbumEntityTable localAlbumEntity = i7
      .$LocalAlbumEntityTable(this);
  late final i8.$LocalAlbumAssetEntityTable localAlbumAssetEntity = i8
      .$LocalAlbumAssetEntityTable(this);
  late final i9.$AuthUserEntityTable authUserEntity = i9.$AuthUserEntityTable(
    this,
  );
  late final i10.$UserMetadataEntityTable userMetadataEntity = i10
      .$UserMetadataEntityTable(this);
  late final i11.$PartnerEntityTable partnerEntity = i11.$PartnerEntityTable(
    this,
  );
  late final i12.$RemoteExifEntityTable remoteExifEntity = i12
      .$RemoteExifEntityTable(this);
  late final i13.$RemoteAlbumAssetEntityTable remoteAlbumAssetEntity = i13
      .$RemoteAlbumAssetEntityTable(this);
  late final i14.$RemoteAlbumUserEntityTable remoteAlbumUserEntity = i14
      .$RemoteAlbumUserEntityTable(this);
  late final i15.$MemoryEntityTable memoryEntity = i15.$MemoryEntityTable(this);
  late final i16.$MemoryAssetEntityTable memoryAssetEntity = i16
      .$MemoryAssetEntityTable(this);
  late final i17.$PersonEntityTable personEntity = i17.$PersonEntityTable(this);
  late final i18.$AssetFaceEntityTable assetFaceEntity = i18
      .$AssetFaceEntityTable(this);
  late final i19.$StoreEntityTable storeEntity = i19.$StoreEntityTable(this);
  late final i20.$TrashedLocalAssetEntityTable trashedLocalAssetEntity = i20
      .$TrashedLocalAssetEntityTable(this);
  i21.MergedAssetDrift get mergedAssetDrift => i22.ReadDatabaseContainer(
    this,
  ).accessor<i21.MergedAssetDrift>(i21.MergedAssetDrift.new);
  i1.UploadTasksDrift get uploadTasksDrift => i22.ReadDatabaseContainer(
    this,
  ).accessor<i1.UploadTasksDrift>(i1.UploadTasksDrift.new);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [
    uploadTasks,
    uploadTaskStats,
    i1.updateStatsInsert,
    i1.updateStatsUpdate,
    i1.updateStatsDelete,
    i1.idxUploadTasksLocalId,
    i1.idxUploadTasksAssetData,
    i1.$drift0,
    userEntity,
    remoteAssetEntity,
    stackEntity,
    localAssetEntity,
    remoteAlbumEntity,
    localAlbumEntity,
    localAlbumAssetEntity,
    i5.idxLocalAssetChecksum,
    i3.idxRemoteAssetOwnerChecksum,
    i3.uQRemoteAssetsOwnerChecksum,
    i3.uQRemoteAssetsOwnerLibraryChecksum,
    i3.idxRemoteAssetChecksum,
    authUserEntity,
    userMetadataEntity,
    partnerEntity,
    remoteExifEntity,
    remoteAlbumAssetEntity,
    remoteAlbumUserEntity,
    memoryEntity,
    memoryAssetEntity,
    personEntity,
    assetFaceEntity,
    storeEntity,
    trashedLocalAssetEntity,
    i12.idxLatLng,
    i20.idxTrashedLocalAssetChecksum,
    i20.idxTrashedLocalAssetAlbum,
  ];
  @override
  i0.StreamQueryUpdateRules
  get streamUpdateRules => const i0.StreamQueryUpdateRules([
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'upload_tasks',
        limitUpdateKind: i0.UpdateKind.insert,
      ),
      result: [i0.TableUpdate('upload_task_stats', kind: i0.UpdateKind.update)],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'upload_tasks',
        limitUpdateKind: i0.UpdateKind.update,
      ),
      result: [i0.TableUpdate('upload_task_stats', kind: i0.UpdateKind.update)],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'upload_tasks',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [i0.TableUpdate('upload_task_stats', kind: i0.UpdateKind.update)],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('remote_asset_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [i0.TableUpdate('stack_entity', kind: i0.UpdateKind.delete)],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('remote_album_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'remote_asset_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('remote_album_entity', kind: i0.UpdateKind.update),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'remote_album_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('local_album_entity', kind: i0.UpdateKind.update),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'local_asset_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('local_album_asset_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'local_album_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('local_album_asset_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('user_metadata_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [i0.TableUpdate('partner_entity', kind: i0.UpdateKind.delete)],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [i0.TableUpdate('partner_entity', kind: i0.UpdateKind.delete)],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'remote_asset_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('remote_exif_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'remote_asset_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('remote_album_asset_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'remote_album_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('remote_album_asset_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'remote_album_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('remote_album_user_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('remote_album_user_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [i0.TableUpdate('memory_entity', kind: i0.UpdateKind.delete)],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'remote_asset_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('memory_asset_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'memory_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('memory_asset_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [i0.TableUpdate('person_entity', kind: i0.UpdateKind.delete)],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'remote_asset_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [i0.TableUpdate('asset_face_entity', kind: i0.UpdateKind.delete)],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'person_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [i0.TableUpdate('asset_face_entity', kind: i0.UpdateKind.update)],
    ),
  ]);
  @override
  i0.DriftDatabaseOptions get options =>
      const i0.DriftDatabaseOptions(storeDateTimeAsText: true);
}

class $DriftManager {
  final $Drift _db;
  $DriftManager(this._db);
  i1.$UploadTasksTableManager get uploadTasks =>
      i1.$UploadTasksTableManager(_db, _db.uploadTasks);
  i1.$UploadTaskStatsTableManager get uploadTaskStats =>
      i1.$UploadTaskStatsTableManager(_db, _db.uploadTaskStats);
  i2.$$UserEntityTableTableManager get userEntity =>
      i2.$$UserEntityTableTableManager(_db, _db.userEntity);
  i3.$$RemoteAssetEntityTableTableManager get remoteAssetEntity =>
      i3.$$RemoteAssetEntityTableTableManager(_db, _db.remoteAssetEntity);
  i4.$$StackEntityTableTableManager get stackEntity =>
      i4.$$StackEntityTableTableManager(_db, _db.stackEntity);
  i5.$$LocalAssetEntityTableTableManager get localAssetEntity =>
      i5.$$LocalAssetEntityTableTableManager(_db, _db.localAssetEntity);
  i6.$$RemoteAlbumEntityTableTableManager get remoteAlbumEntity =>
      i6.$$RemoteAlbumEntityTableTableManager(_db, _db.remoteAlbumEntity);
  i7.$$LocalAlbumEntityTableTableManager get localAlbumEntity =>
      i7.$$LocalAlbumEntityTableTableManager(_db, _db.localAlbumEntity);
  i8.$$LocalAlbumAssetEntityTableTableManager get localAlbumAssetEntity => i8
      .$$LocalAlbumAssetEntityTableTableManager(_db, _db.localAlbumAssetEntity);
  i9.$$AuthUserEntityTableTableManager get authUserEntity =>
      i9.$$AuthUserEntityTableTableManager(_db, _db.authUserEntity);
  i10.$$UserMetadataEntityTableTableManager get userMetadataEntity =>
      i10.$$UserMetadataEntityTableTableManager(_db, _db.userMetadataEntity);
  i11.$$PartnerEntityTableTableManager get partnerEntity =>
      i11.$$PartnerEntityTableTableManager(_db, _db.partnerEntity);
  i12.$$RemoteExifEntityTableTableManager get remoteExifEntity =>
      i12.$$RemoteExifEntityTableTableManager(_db, _db.remoteExifEntity);
  i13.$$RemoteAlbumAssetEntityTableTableManager get remoteAlbumAssetEntity =>
      i13.$$RemoteAlbumAssetEntityTableTableManager(
        _db,
        _db.remoteAlbumAssetEntity,
      );
  i14.$$RemoteAlbumUserEntityTableTableManager get remoteAlbumUserEntity => i14
      .$$RemoteAlbumUserEntityTableTableManager(_db, _db.remoteAlbumUserEntity);
  i15.$$MemoryEntityTableTableManager get memoryEntity =>
      i15.$$MemoryEntityTableTableManager(_db, _db.memoryEntity);
  i16.$$MemoryAssetEntityTableTableManager get memoryAssetEntity =>
      i16.$$MemoryAssetEntityTableTableManager(_db, _db.memoryAssetEntity);
  i17.$$PersonEntityTableTableManager get personEntity =>
      i17.$$PersonEntityTableTableManager(_db, _db.personEntity);
  i18.$$AssetFaceEntityTableTableManager get assetFaceEntity =>
      i18.$$AssetFaceEntityTableTableManager(_db, _db.assetFaceEntity);
  i19.$$StoreEntityTableTableManager get storeEntity =>
      i19.$$StoreEntityTableTableManager(_db, _db.storeEntity);
  i20.$$TrashedLocalAssetEntityTableTableManager get trashedLocalAssetEntity =>
      i20.$$TrashedLocalAssetEntityTableTableManager(
        _db,
        _db.trashedLocalAssetEntity,
      );
}
