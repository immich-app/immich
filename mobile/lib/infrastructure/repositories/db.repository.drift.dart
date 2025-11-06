// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/local_asset_upload_entity.drift.dart'
    as i4;
import 'package:immich_mobile/infrastructure/entities/local_asset_upload_trigger.drift.dart'
    as i5;
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart'
    as i6;
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart'
    as i7;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i8;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i9;
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart'
    as i10;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart'
    as i11;
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart'
    as i12;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart'
    as i13;
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart'
    as i14;
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.drift.dart'
    as i15;
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart'
    as i16;
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.drift.dart'
    as i17;
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart'
    as i18;
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart'
    as i19;
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart'
    as i20;
import 'package:immich_mobile/infrastructure/entities/merged_asset.drift.dart'
    as i21;
import 'package:drift/internal/modular.dart' as i22;

abstract class $Drift extends i0.GeneratedDatabase {
  $Drift(i0.QueryExecutor e) : super(e);
  $DriftManager get managers => $DriftManager(this);
  late final i1.$UserEntityTable userEntity = i1.$UserEntityTable(this);
  late final i2.$RemoteAssetEntityTable remoteAssetEntity = i2
      .$RemoteAssetEntityTable(this);
  late final i3.$LocalAssetEntityTable localAssetEntity = i3
      .$LocalAssetEntityTable(this);
  late final i4.$LocalAssetUploadEntityTable localAssetUploadEntity = i4
      .$LocalAssetUploadEntityTable(this);
  late final i6.$StackEntityTable stackEntity = i6.$StackEntityTable(this);
  late final i7.$RemoteAlbumEntityTable remoteAlbumEntity = i7
      .$RemoteAlbumEntityTable(this);
  late final i8.$LocalAlbumEntityTable localAlbumEntity = i8
      .$LocalAlbumEntityTable(this);
  late final i9.$LocalAlbumAssetEntityTable localAlbumAssetEntity = i9
      .$LocalAlbumAssetEntityTable(this);
  late final i10.$AuthUserEntityTable authUserEntity = i10.$AuthUserEntityTable(
    this,
  );
  late final i11.$UserMetadataEntityTable userMetadataEntity = i11
      .$UserMetadataEntityTable(this);
  late final i12.$PartnerEntityTable partnerEntity = i12.$PartnerEntityTable(
    this,
  );
  late final i13.$RemoteExifEntityTable remoteExifEntity = i13
      .$RemoteExifEntityTable(this);
  late final i14.$RemoteAlbumAssetEntityTable remoteAlbumAssetEntity = i14
      .$RemoteAlbumAssetEntityTable(this);
  late final i15.$RemoteAlbumUserEntityTable remoteAlbumUserEntity = i15
      .$RemoteAlbumUserEntityTable(this);
  late final i16.$MemoryEntityTable memoryEntity = i16.$MemoryEntityTable(this);
  late final i17.$MemoryAssetEntityTable memoryAssetEntity = i17
      .$MemoryAssetEntityTable(this);
  late final i18.$PersonEntityTable personEntity = i18.$PersonEntityTable(this);
  late final i19.$AssetFaceEntityTable assetFaceEntity = i19
      .$AssetFaceEntityTable(this);
  late final i20.$StoreEntityTable storeEntity = i20.$StoreEntityTable(this);
  i21.MergedAssetDrift get mergedAssetDrift => i22.ReadDatabaseContainer(
    this,
  ).accessor<i21.MergedAssetDrift>(i21.MergedAssetDrift.new);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [
    userEntity,
    remoteAssetEntity,
    localAssetEntity,
    localAssetUploadEntity,
    i5.deleteUploadErrorOnRemoteInsert,
    i3.idxLocalAssetChecksum,
    i2.idxRemoteAssetOwnerChecksum,
    i2.uQRemoteAssetsOwnerChecksum,
    i2.uQRemoteAssetsOwnerLibraryChecksum,
    i2.idxRemoteAssetChecksum,
    stackEntity,
    remoteAlbumEntity,
    localAlbumEntity,
    localAlbumAssetEntity,
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
    i13.idxLatLng,
  ];
  @override
  i0.StreamQueryUpdateRules
  get streamUpdateRules => const i0.StreamQueryUpdateRules([
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
        'local_asset_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('local_asset_upload_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'remote_asset_entity',
        limitUpdateKind: i0.UpdateKind.insert,
      ),
      result: [
        i0.TableUpdate('local_asset_upload_entity', kind: i0.UpdateKind.delete),
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
  i1.$$UserEntityTableTableManager get userEntity =>
      i1.$$UserEntityTableTableManager(_db, _db.userEntity);
  i2.$$RemoteAssetEntityTableTableManager get remoteAssetEntity =>
      i2.$$RemoteAssetEntityTableTableManager(_db, _db.remoteAssetEntity);
  i3.$$LocalAssetEntityTableTableManager get localAssetEntity =>
      i3.$$LocalAssetEntityTableTableManager(_db, _db.localAssetEntity);
  i4.$$LocalAssetUploadEntityTableTableManager get localAssetUploadEntity =>
      i4.$$LocalAssetUploadEntityTableTableManager(
        _db,
        _db.localAssetUploadEntity,
      );
  i6.$$StackEntityTableTableManager get stackEntity =>
      i6.$$StackEntityTableTableManager(_db, _db.stackEntity);
  i7.$$RemoteAlbumEntityTableTableManager get remoteAlbumEntity =>
      i7.$$RemoteAlbumEntityTableTableManager(_db, _db.remoteAlbumEntity);
  i8.$$LocalAlbumEntityTableTableManager get localAlbumEntity =>
      i8.$$LocalAlbumEntityTableTableManager(_db, _db.localAlbumEntity);
  i9.$$LocalAlbumAssetEntityTableTableManager get localAlbumAssetEntity => i9
      .$$LocalAlbumAssetEntityTableTableManager(_db, _db.localAlbumAssetEntity);
  i10.$$AuthUserEntityTableTableManager get authUserEntity =>
      i10.$$AuthUserEntityTableTableManager(_db, _db.authUserEntity);
  i11.$$UserMetadataEntityTableTableManager get userMetadataEntity =>
      i11.$$UserMetadataEntityTableTableManager(_db, _db.userMetadataEntity);
  i12.$$PartnerEntityTableTableManager get partnerEntity =>
      i12.$$PartnerEntityTableTableManager(_db, _db.partnerEntity);
  i13.$$RemoteExifEntityTableTableManager get remoteExifEntity =>
      i13.$$RemoteExifEntityTableTableManager(_db, _db.remoteExifEntity);
  i14.$$RemoteAlbumAssetEntityTableTableManager get remoteAlbumAssetEntity =>
      i14.$$RemoteAlbumAssetEntityTableTableManager(
        _db,
        _db.remoteAlbumAssetEntity,
      );
  i15.$$RemoteAlbumUserEntityTableTableManager get remoteAlbumUserEntity => i15
      .$$RemoteAlbumUserEntityTableTableManager(_db, _db.remoteAlbumUserEntity);
  i16.$$MemoryEntityTableTableManager get memoryEntity =>
      i16.$$MemoryEntityTableTableManager(_db, _db.memoryEntity);
  i17.$$MemoryAssetEntityTableTableManager get memoryAssetEntity =>
      i17.$$MemoryAssetEntityTableTableManager(_db, _db.memoryAssetEntity);
  i18.$$PersonEntityTableTableManager get personEntity =>
      i18.$$PersonEntityTableTableManager(_db, _db.personEntity);
  i19.$$AssetFaceEntityTableTableManager get assetFaceEntity =>
      i19.$$AssetFaceEntityTableTableManager(_db, _db.assetFaceEntity);
  i20.$$StoreEntityTableTableManager get storeEntity =>
      i20.$$StoreEntityTableTableManager(_db, _db.storeEntity);
}
