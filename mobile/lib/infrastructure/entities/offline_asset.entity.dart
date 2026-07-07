import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

/// Tracks files downloaded to app-private storage for offline albums.
///
/// [assetId] intentionally has no foreign key on remote_asset_entity: motion
/// photo video assets (livePhotoVideoId) are downloaded as well but do not
/// have a corresponding remote asset row.
class OfflineAssetEntity extends Table with DriftDefaultsMixin {
  const OfflineAssetEntity();

  TextColumn get assetId => text()();

  /// File name of the downloaded original inside the offline assets directory
  TextColumn get fileName => text().nullable()();

  /// File name of the downloaded thumbnail inside the offline assets directory
  TextColumn get thumbFileName => text().nullable()();

  IntColumn get fileSize => integer().withDefault(const Constant(0))();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {assetId};
}
