// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart'
    as i1;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart'
    as i2;
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart'
    as i3;
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart'
    as i4;
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart'
    as i5;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i6;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i7;
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart'
    as i8;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart'
    as i9;
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart'
    as i10;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart'
    as i11;
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart'
    as i12;
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.drift.dart'
    as i13;
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart'
    as i14;
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.drift.dart'
    as i15;
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart'
    as i16;
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart'
    as i17;
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart'
    as i18;
import 'package:immich_mobile/infrastructure/entities/merged_asset.drift.dart'
    as i19;
import 'package:drift/internal/modular.dart' as i20;

abstract class $Drift extends i0.GeneratedDatabase {
  $Drift(i0.QueryExecutor e) : super(e);
  $DriftManager get managers => $DriftManager(this);
  late final i1.$UserEntityTable userEntity = i1.$UserEntityTable(this);
  late final i2.$RemoteAssetEntityTable remoteAssetEntity = i2
      .$RemoteAssetEntityTable(this);
  late final i3.$StackEntityTable stackEntity = i3.$StackEntityTable(this);
  late final i4.$LocalAssetEntityTable localAssetEntity = i4
      .$LocalAssetEntityTable(this);
  late final i5.$RemoteAlbumEntityTable remoteAlbumEntity = i5
      .$RemoteAlbumEntityTable(this);
  late final i6.$LocalAlbumEntityTable localAlbumEntity = i6
      .$LocalAlbumEntityTable(this);
  late final i7.$LocalAlbumAssetEntityTable localAlbumAssetEntity = i7
      .$LocalAlbumAssetEntityTable(this);
  late final i8.$AuthUserEntityTable authUserEntity = i8.$AuthUserEntityTable(
    this,
  );
  late final i9.$UserMetadataEntityTable userMetadataEntity = i9
      .$UserMetadataEntityTable(this);
  late final i10.$PartnerEntityTable partnerEntity = i10.$PartnerEntityTable(
    this,
  );
  late final i11.$RemoteExifEntityTable remoteExifEntity = i11
      .$RemoteExifEntityTable(this);
  late final i12.$RemoteAlbumAssetEntityTable remoteAlbumAssetEntity = i12
      .$RemoteAlbumAssetEntityTable(this);
  late final i13.$RemoteAlbumUserEntityTable remoteAlbumUserEntity = i13
      .$RemoteAlbumUserEntityTable(this);
  late final i14.$MemoryEntityTable memoryEntity = i14.$MemoryEntityTable(this);
  late final i15.$MemoryAssetEntityTable memoryAssetEntity = i15
      .$MemoryAssetEntityTable(this);
  late final i16.$PersonEntityTable personEntity = i16.$PersonEntityTable(this);
  late final i17.$AssetFaceEntityTable assetFaceEntity = i17
      .$AssetFaceEntityTable(this);
  late final i18.$StoreEntityTable storeEntity = i18.$StoreEntityTable(this);
  i19.MergedAssetDrift get mergedAssetDrift => i20.ReadDatabaseContainer(
    this,
  ).accessor<i19.MergedAssetDrift>(i19.MergedAssetDrift.new);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [
    userEntity,
    remoteAssetEntity,
    stackEntity,
    localAssetEntity,
    remoteAlbumEntity,
    localAlbumEntity,
    localAlbumAssetEntity,
    i4.idxLocalAssetChecksum,
    i2.idxRemoteAssetOwnerChecksum,
    i2.uQRemoteAssetsOwnerChecksum,
    i2.uQRemoteAssetsOwnerLibraryChecksum,
    i2.idxRemoteAssetChecksum,
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
    i11.idxLatLng,
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
  i3.$$StackEntityTableTableManager get stackEntity =>
      i3.$$StackEntityTableTableManager(_db, _db.stackEntity);
  i4.$$LocalAssetEntityTableTableManager get localAssetEntity =>
      i4.$$LocalAssetEntityTableTableManager(_db, _db.localAssetEntity);
  i5.$$RemoteAlbumEntityTableTableManager get remoteAlbumEntity =>
      i5.$$RemoteAlbumEntityTableTableManager(_db, _db.remoteAlbumEntity);
  i6.$$LocalAlbumEntityTableTableManager get localAlbumEntity =>
      i6.$$LocalAlbumEntityTableTableManager(_db, _db.localAlbumEntity);
  i7.$$LocalAlbumAssetEntityTableTableManager get localAlbumAssetEntity => i7
      .$$LocalAlbumAssetEntityTableTableManager(_db, _db.localAlbumAssetEntity);
  i8.$$AuthUserEntityTableTableManager get authUserEntity =>
      i8.$$AuthUserEntityTableTableManager(_db, _db.authUserEntity);
  i9.$$UserMetadataEntityTableTableManager get userMetadataEntity =>
      i9.$$UserMetadataEntityTableTableManager(_db, _db.userMetadataEntity);
  i10.$$PartnerEntityTableTableManager get partnerEntity =>
      i10.$$PartnerEntityTableTableManager(_db, _db.partnerEntity);
  i11.$$RemoteExifEntityTableTableManager get remoteExifEntity =>
      i11.$$RemoteExifEntityTableTableManager(_db, _db.remoteExifEntity);
  i12.$$RemoteAlbumAssetEntityTableTableManager get remoteAlbumAssetEntity =>
      i12.$$RemoteAlbumAssetEntityTableTableManager(
        _db,
        _db.remoteAlbumAssetEntity,
      );
  i13.$$RemoteAlbumUserEntityTableTableManager get remoteAlbumUserEntity => i13
      .$$RemoteAlbumUserEntityTableTableManager(_db, _db.remoteAlbumUserEntity);
  i14.$$MemoryEntityTableTableManager get memoryEntity =>
      i14.$$MemoryEntityTableTableManager(_db, _db.memoryEntity);
  i15.$$MemoryAssetEntityTableTableManager get memoryAssetEntity =>
      i15.$$MemoryAssetEntityTableTableManager(_db, _db.memoryAssetEntity);
  i16.$$PersonEntityTableTableManager get personEntity =>
      i16.$$PersonEntityTableTableManager(_db, _db.personEntity);
  i17.$$AssetFaceEntityTableTableManager get assetFaceEntity =>
      i17.$$AssetFaceEntityTableTableManager(_db, _db.assetFaceEntity);
  i18.$$StoreEntityTableTableManager get storeEntity =>
      i18.$$StoreEntityTableTableManager(_db, _db.storeEntity);
}
