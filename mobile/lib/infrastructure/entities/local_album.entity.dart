import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class LocalAlbumEntity extends Table with DriftDefaultsMixin {
  const LocalAlbumEntity();

  TextColumn get id => text()();
  TextColumn get name => text()();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get backupSelection => intEnum<BackupSelection>()();
  BoolColumn get isIosSharedAlbum => boolean().withDefault(const Constant(false))();

  // // Linked album for putting assets to the remote album after finished uploading
  TextColumn get linkedRemoteAlbumId =>
      text().references(RemoteAlbumEntity, #id, onDelete: KeyAction.setNull).nullable()();

  // Used for mark & sweep
  BoolColumn get marker_ => boolean().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

extension LocalAlbumEntityDataHelper on LocalAlbumEntityData {
  LocalAlbum toDto({int assetCount = 0}) {
    return LocalAlbum(
      id: id,
      name: name,
      updatedAt: updatedAt,
      assetCount: assetCount,
      backupSelection: backupSelection,
      linkedRemoteAlbumId: linkedRemoteAlbumId,
    );
  }
}
