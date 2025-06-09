import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class RemoteAlbumEntity extends Table with DriftDefaultsMixin {
  const RemoteAlbumEntity();

  TextColumn get id => text()();

  TextColumn get name => text()();

  TextColumn get description => text()();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  TextColumn get ownerId =>
      text().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get thumbnailAssetId => text()
      .references(RemoteAssetEntity, #id, onDelete: KeyAction.setNull)
      .nullable()();

  BoolColumn get isActivityEnabled =>
      boolean().withDefault(const Constant(true))();

  IntColumn get order => intEnum<AssetOrder>()();

  @override
  Set<Column> get primaryKey => {id};
}
