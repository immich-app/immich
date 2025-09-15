import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/asset.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex.sql(
  'CREATE INDEX IF NOT EXISTS idx_remote_asset_owner_checksum ON remote_asset_entity (owner_id, checksum)',
)
@TableIndex.sql('''
CREATE UNIQUE INDEX IF NOT EXISTS UQ_remote_assets_owner_checksum
ON remote_asset_entity (owner_id, checksum)
WHERE (library_id IS NULL);
''')
@TableIndex.sql('''
CREATE UNIQUE INDEX IF NOT EXISTS UQ_remote_assets_owner_library_checksum
ON remote_asset_entity (owner_id, library_id, checksum)
WHERE (library_id IS NOT NULL);
''')
@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_remote_asset_checksum ON remote_asset_entity (checksum)')
class RemoteAssetEntity extends Table with DriftDefaultsMixin, AssetEntityMixin {
  const RemoteAssetEntity();

  TextColumn get id => text()();

  TextColumn get checksum => text()();

  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  TextColumn get ownerId => text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  DateTimeColumn get localDateTime => dateTime().nullable()();

  TextColumn get thumbHash => text().nullable()();

  DateTimeColumn get deletedAt => dateTime().nullable()();

  TextColumn get livePhotoVideoId => text().nullable()();

  IntColumn get visibility => intEnum<AssetVisibility>()();

  TextColumn get stackId => text().nullable()();

  TextColumn get libraryId => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

extension RemoteAssetEntityDataDomainEx on RemoteAssetEntityData {
  RemoteAsset toDto() => RemoteAsset(
    id: id,
    name: name,
    ownerId: ownerId,
    checksum: checksum,
    type: type,
    createdAt: createdAt,
    updatedAt: updatedAt,
    durationInSeconds: durationInSeconds,
    isFavorite: isFavorite,
    height: height,
    width: width,
    thumbHash: thumbHash,
    visibility: visibility,
    livePhotoVideoId: livePhotoVideoId,
    localId: null,
    stackId: stackId,
  );
}
