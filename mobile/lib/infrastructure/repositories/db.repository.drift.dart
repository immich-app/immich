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
import 'package:immich_mobile/infrastructure/entities/shared_space.entity.drift.dart'
    as i5;
import 'package:immich_mobile/infrastructure/entities/shared_space_asset.entity.drift.dart'
    as i6;
import 'package:immich_mobile/infrastructure/entities/shared_space_member.entity.drift.dart'
    as i7;
import 'package:immich_mobile/infrastructure/entities/shared_space_library.entity.drift.dart'
    as i8;
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart'
    as i9;
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart'
    as i10;
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart'
    as i11;
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart'
    as i12;
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart'
    as i13;
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart'
    as i14;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart'
    as i15;
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart'
    as i16;
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.drift.dart'
    as i17;
import 'package:immich_mobile/infrastructure/entities/remote_asset_cloud_id.entity.drift.dart'
    as i18;
import 'package:immich_mobile/infrastructure/entities/library.entity.drift.dart'
    as i19;
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart'
    as i20;
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.drift.dart'
    as i21;
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart'
    as i22;
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart'
    as i23;
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart'
    as i24;
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart'
    as i25;
import 'package:immich_mobile/infrastructure/entities/asset_edit.entity.drift.dart'
    as i26;
import 'package:immich_mobile/infrastructure/entities/merged_asset.drift.dart'
    as i27;
import 'package:drift/internal/modular.dart' as i28;

abstract class $Drift extends i0.GeneratedDatabase {
  $Drift(i0.QueryExecutor e) : super(e);
  $DriftManager get managers => $DriftManager(this);
  late final i1.$UserEntityTable userEntity = i1.$UserEntityTable(this);
  late final i2.$RemoteAssetEntityTable remoteAssetEntity = i2
      .$RemoteAssetEntityTable(this);
  late final i3.$StackEntityTable stackEntity = i3.$StackEntityTable(this);
  late final i4.$LocalAssetEntityTable localAssetEntity = i4
      .$LocalAssetEntityTable(this);
  late final i5.$SharedSpaceEntityTable sharedSpaceEntity = i5
      .$SharedSpaceEntityTable(this);
  late final i6.$SharedSpaceAssetEntityTable sharedSpaceAssetEntity = i6
      .$SharedSpaceAssetEntityTable(this);
  late final i7.$SharedSpaceMemberEntityTable sharedSpaceMemberEntity = i7
      .$SharedSpaceMemberEntityTable(this);
  late final i8.$SharedSpaceLibraryEntityTable sharedSpaceLibraryEntity = i8
      .$SharedSpaceLibraryEntityTable(this);
  late final i9.$RemoteAlbumEntityTable remoteAlbumEntity = i9
      .$RemoteAlbumEntityTable(this);
  late final i10.$LocalAlbumEntityTable localAlbumEntity = i10
      .$LocalAlbumEntityTable(this);
  late final i11.$LocalAlbumAssetEntityTable localAlbumAssetEntity = i11
      .$LocalAlbumAssetEntityTable(this);
  late final i12.$AuthUserEntityTable authUserEntity = i12.$AuthUserEntityTable(
    this,
  );
  late final i13.$UserMetadataEntityTable userMetadataEntity = i13
      .$UserMetadataEntityTable(this);
  late final i14.$PartnerEntityTable partnerEntity = i14.$PartnerEntityTable(
    this,
  );
  late final i15.$RemoteExifEntityTable remoteExifEntity = i15
      .$RemoteExifEntityTable(this);
  late final i16.$RemoteAlbumAssetEntityTable remoteAlbumAssetEntity = i16
      .$RemoteAlbumAssetEntityTable(this);
  late final i17.$RemoteAlbumUserEntityTable remoteAlbumUserEntity = i17
      .$RemoteAlbumUserEntityTable(this);
  late final i18.$RemoteAssetCloudIdEntityTable remoteAssetCloudIdEntity = i18
      .$RemoteAssetCloudIdEntityTable(this);
  late final i19.$LibraryEntityTable libraryEntity = i19.$LibraryEntityTable(
    this,
  );
  late final i20.$MemoryEntityTable memoryEntity = i20.$MemoryEntityTable(this);
  late final i21.$MemoryAssetEntityTable memoryAssetEntity = i21
      .$MemoryAssetEntityTable(this);
  late final i22.$PersonEntityTable personEntity = i22.$PersonEntityTable(this);
  late final i23.$AssetFaceEntityTable assetFaceEntity = i23
      .$AssetFaceEntityTable(this);
  late final i24.$StoreEntityTable storeEntity = i24.$StoreEntityTable(this);
  late final i25.$TrashedLocalAssetEntityTable trashedLocalAssetEntity = i25
      .$TrashedLocalAssetEntityTable(this);
  late final i26.$AssetEditEntityTable assetEditEntity = i26
      .$AssetEditEntityTable(this);
  i27.MergedAssetDrift get mergedAssetDrift => i28.ReadDatabaseContainer(
    this,
  ).accessor<i27.MergedAssetDrift>(i27.MergedAssetDrift.new);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [
    userEntity,
    remoteAssetEntity,
    stackEntity,
    localAssetEntity,
    sharedSpaceEntity,
    sharedSpaceAssetEntity,
    sharedSpaceMemberEntity,
    sharedSpaceLibraryEntity,
    remoteAlbumEntity,
    localAlbumEntity,
    localAlbumAssetEntity,
    i5.idxSharedSpaceCreatedById,
    i8.idxSharedSpaceLibrarySpaceId,
    i8.idxSharedSpaceLibraryLibrarySpace,
    i6.idxSharedSpaceAssetSpaceAsset,
    i6.idxSharedSpaceAssetAssetSpace,
    i11.idxLocalAlbumAssetAlbumAsset,
    i9.idxRemoteAlbumOwnerId,
    i4.idxLocalAssetChecksum,
    i4.idxLocalAssetCloudId,
    i3.idxStackPrimaryAssetId,
    i2.idxRemoteAssetOwnerChecksum,
    i2.uQRemoteAssetsOwnerChecksum,
    i2.uQRemoteAssetsOwnerLibraryChecksum,
    i2.idxRemoteAssetChecksum,
    i2.idxRemoteAssetStackId,
    i2.idxRemoteAssetLocalDateTimeDay,
    i2.idxRemoteAssetLocalDateTimeMonth,
    i2.idxRemoteAssetLibraryCreated,
    authUserEntity,
    userMetadataEntity,
    partnerEntity,
    remoteExifEntity,
    remoteAlbumAssetEntity,
    remoteAlbumUserEntity,
    remoteAssetCloudIdEntity,
    libraryEntity,
    memoryEntity,
    memoryAssetEntity,
    personEntity,
    assetFaceEntity,
    storeEntity,
    trashedLocalAssetEntity,
    assetEditEntity,
    i14.idxPartnerSharedWithId,
    i15.idxLatLng,
    i16.idxRemoteAlbumAssetAlbumAsset,
    i18.idxRemoteAssetCloudId,
    i22.idxPersonOwnerId,
    i23.idxAssetFacePersonId,
    i23.idxAssetFaceAssetId,
    i25.idxTrashedLocalAssetChecksum,
    i25.idxTrashedLocalAssetAlbum,
    i26.idxAssetEditAssetId,
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
        i0.TableUpdate('shared_space_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'shared_space_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate('shared_space_asset_entity', kind: i0.UpdateKind.delete),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'shared_space_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate(
          'shared_space_member_entity',
          kind: i0.UpdateKind.delete,
        ),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate(
          'shared_space_member_entity',
          kind: i0.UpdateKind.delete,
        ),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'shared_space_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate(
          'shared_space_library_entity',
          kind: i0.UpdateKind.delete,
        ),
      ],
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
        'remote_asset_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [
        i0.TableUpdate(
          'remote_asset_cloud_id_entity',
          kind: i0.UpdateKind.delete,
        ),
      ],
    ),
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'user_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [i0.TableUpdate('library_entity', kind: i0.UpdateKind.delete)],
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
    i0.WritePropagation(
      on: i0.TableUpdateQuery.onTableName(
        'remote_asset_entity',
        limitUpdateKind: i0.UpdateKind.delete,
      ),
      result: [i0.TableUpdate('asset_edit_entity', kind: i0.UpdateKind.delete)],
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
  i5.$$SharedSpaceEntityTableTableManager get sharedSpaceEntity =>
      i5.$$SharedSpaceEntityTableTableManager(_db, _db.sharedSpaceEntity);
  i6.$$SharedSpaceAssetEntityTableTableManager get sharedSpaceAssetEntity =>
      i6.$$SharedSpaceAssetEntityTableTableManager(
        _db,
        _db.sharedSpaceAssetEntity,
      );
  i7.$$SharedSpaceMemberEntityTableTableManager get sharedSpaceMemberEntity =>
      i7.$$SharedSpaceMemberEntityTableTableManager(
        _db,
        _db.sharedSpaceMemberEntity,
      );
  i8.$$SharedSpaceLibraryEntityTableTableManager get sharedSpaceLibraryEntity =>
      i8.$$SharedSpaceLibraryEntityTableTableManager(
        _db,
        _db.sharedSpaceLibraryEntity,
      );
  i9.$$RemoteAlbumEntityTableTableManager get remoteAlbumEntity =>
      i9.$$RemoteAlbumEntityTableTableManager(_db, _db.remoteAlbumEntity);
  i10.$$LocalAlbumEntityTableTableManager get localAlbumEntity =>
      i10.$$LocalAlbumEntityTableTableManager(_db, _db.localAlbumEntity);
  i11.$$LocalAlbumAssetEntityTableTableManager get localAlbumAssetEntity => i11
      .$$LocalAlbumAssetEntityTableTableManager(_db, _db.localAlbumAssetEntity);
  i12.$$AuthUserEntityTableTableManager get authUserEntity =>
      i12.$$AuthUserEntityTableTableManager(_db, _db.authUserEntity);
  i13.$$UserMetadataEntityTableTableManager get userMetadataEntity =>
      i13.$$UserMetadataEntityTableTableManager(_db, _db.userMetadataEntity);
  i14.$$PartnerEntityTableTableManager get partnerEntity =>
      i14.$$PartnerEntityTableTableManager(_db, _db.partnerEntity);
  i15.$$RemoteExifEntityTableTableManager get remoteExifEntity =>
      i15.$$RemoteExifEntityTableTableManager(_db, _db.remoteExifEntity);
  i16.$$RemoteAlbumAssetEntityTableTableManager get remoteAlbumAssetEntity =>
      i16.$$RemoteAlbumAssetEntityTableTableManager(
        _db,
        _db.remoteAlbumAssetEntity,
      );
  i17.$$RemoteAlbumUserEntityTableTableManager get remoteAlbumUserEntity => i17
      .$$RemoteAlbumUserEntityTableTableManager(_db, _db.remoteAlbumUserEntity);
  i18.$$RemoteAssetCloudIdEntityTableTableManager
  get remoteAssetCloudIdEntity =>
      i18.$$RemoteAssetCloudIdEntityTableTableManager(
        _db,
        _db.remoteAssetCloudIdEntity,
      );
  i19.$$LibraryEntityTableTableManager get libraryEntity =>
      i19.$$LibraryEntityTableTableManager(_db, _db.libraryEntity);
  i20.$$MemoryEntityTableTableManager get memoryEntity =>
      i20.$$MemoryEntityTableTableManager(_db, _db.memoryEntity);
  i21.$$MemoryAssetEntityTableTableManager get memoryAssetEntity =>
      i21.$$MemoryAssetEntityTableTableManager(_db, _db.memoryAssetEntity);
  i22.$$PersonEntityTableTableManager get personEntity =>
      i22.$$PersonEntityTableTableManager(_db, _db.personEntity);
  i23.$$AssetFaceEntityTableTableManager get assetFaceEntity =>
      i23.$$AssetFaceEntityTableTableManager(_db, _db.assetFaceEntity);
  i24.$$StoreEntityTableTableManager get storeEntity =>
      i24.$$StoreEntityTableTableManager(_db, _db.storeEntity);
  i25.$$TrashedLocalAssetEntityTableTableManager get trashedLocalAssetEntity =>
      i25.$$TrashedLocalAssetEntityTableTableManager(
        _db,
        _db.trashedLocalAssetEntity,
      );
  i26.$$AssetEditEntityTableTableManager get assetEditEntity =>
      i26.$$AssetEditEntityTableTableManager(_db, _db.assetEditEntity);
}
