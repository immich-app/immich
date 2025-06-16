import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/asset.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

@TableIndex(
  name: 'UQ_remote_asset_owner_checksum',
  columns: {#checksum, #ownerId},
  unique: true,
)
@TableIndex(name: 'idx_remote_asset_checksum', columns: {#checksum})
class RemoteAssetEntity extends Table
    with DriftDefaultsMixin, AssetEntityMixin {
  const RemoteAssetEntity();

  TextColumn get id => text()();

  TextColumn get checksum => text()();

  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  TextColumn get ownerId =>
      text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  DateTimeColumn get localDateTime => dateTime().nullable()();

  TextColumn get thumbHash => text().nullable()();

  DateTimeColumn get deletedAt => dateTime().nullable()();

  IntColumn get visibility => intEnum<AssetVisibility>()();

  @override
  Set<Column> get primaryKey => {id};
}
