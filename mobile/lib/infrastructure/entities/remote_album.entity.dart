import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class RemoteAlbumEntity extends Table
    with DriftDefaultsMixin {
  const RemoteAlbumEntity();

  BlobColumn get remoteId => blob()();

  TextColumn get name => text()();

  TextColumn get description => text()();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  BlobColumn get ownerId =>
      blob().references(UserEntity, #id, onDelete: KeyAction.cascade)();

  BlobColumn get thumbnailAssetId =>
      blob().references(RemoteAssetEntity, #remoteId, onDelete: KeyAction.setNull)();

  BoolColumn get isActivityEnabled => boolean().withDefault(const Constant(true))();

  IntColumn get order => intEnum<AssetOrder>()();

  @override
  Set<Column> get primaryKey => {remoteId};
}
