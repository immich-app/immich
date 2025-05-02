import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class LocalAlbumEntity extends Table with DriftDefaultsMixin {
  const LocalAlbumEntity();

  TextColumn get id => text()();
  TextColumn get name => text()();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get backupSelection => intEnum<BackupSelection>()();
  BoolColumn get marker_ => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

extension LocalAlbumEntityX on LocalAlbumEntityData {
  LocalAlbum toDto({int assetCount = 0}) {
    return LocalAlbum(
      id: id,
      name: name,
      updatedAt: updatedAt,
      assetCount: assetCount,
      backupSelection: backupSelection,
    );
  }
}
