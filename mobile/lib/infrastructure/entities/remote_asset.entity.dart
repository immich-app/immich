import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/asset.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex(name: 'remote_asset_checksum', columns: {#checksum})
class RemoteAssetEntity extends Table
    with DriftDefaultsMixin, AssetEntityMixin {
  const RemoteAssetEntity();

  BlobColumn get remoteId => blob()();

  TextColumn get checksum => text().unique()();

  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  BlobColumn get ownerId =>
      blob().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  DateTimeColumn get localDateTime => dateTime().nullable()();

  TextColumn get thumbhash => text().nullable()();

  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {remoteId};
}
