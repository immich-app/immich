import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

/// Tracks assets that should be excluded from syncing to a specific local album.
/// When a user moves an asset from Album A to Album B in Immich, we record
/// that the asset should not be re-synced from the local Album A.
class SyncExclusionEntity extends Table with DriftDefaultsMixin {
  const SyncExclusionEntity();

  /// The remote asset ID that was moved
  TextColumn get remoteAssetId => text()();

  /// The local album ID from which to exclude this asset
  TextColumn get localAlbumId => text()();

  /// When the exclusion was created
  DateTimeColumn get excludedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {remoteAssetId, localAlbumId};
}
