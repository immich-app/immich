import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class LocalAlbumEntity extends Table with DriftDefaultsMixin {
  const LocalAlbumEntity();

  TextColumn get id => text()();
  TextColumn get name => text()();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get backupSelection => intEnum<BackupSelection>()();
  BoolColumn get isIosSharedAlbum =>
      boolean().withDefault(const Constant(false))();

  // Used for mark & sweep
  BoolColumn get marker_ => boolean().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
