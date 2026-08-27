import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/table/remote/asset.dart';
import 'package:immich_mobile/data/db/util/defaults_mixin.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';

class RemoteAlbumEntity extends Table with DriftDefaultsMixin {
  const RemoteAlbumEntity();

  TextColumn get id => text()();

  TextColumn get name => text()();

  TextColumn get description => text().withDefault(const Constant(''))();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  TextColumn get thumbnailAssetId =>
      text().references(RemoteAssetEntity, #id, onDelete: KeyAction.setNull).nullable()();

  BoolColumn get isActivityEnabled => boolean().withDefault(const Constant(true))();

  IntColumn get order => intEnum<AlbumAssetOrder>()();

  @override
  Set<Column> get primaryKey => {id};
}
