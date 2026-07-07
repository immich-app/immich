import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

/// Marks a remote album as "available offline". Assets of marked albums are
/// downloaded at full resolution to app-private storage and tracked in
/// [OfflineAssetEntity].
class OfflineAlbumEntity extends Table with DriftDefaultsMixin {
  const OfflineAlbumEntity();

  TextColumn get albumId => text().references(RemoteAlbumEntity, #id, onDelete: KeyAction.cascade)();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {albumId};
}
