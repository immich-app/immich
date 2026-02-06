import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/entities/sync_exclusion.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final syncExclusionRepositoryProvider = Provider<SyncExclusionRepository>(
  (ref) => SyncExclusionRepository(ref.watch(driftProvider)),
);

/// Repository for managing sync exclusions
/// Tracks which remote assets should be excluded from syncing back to specific local albums
class SyncExclusionRepository {
  final Drift _db;

  SyncExclusionRepository(this._db);

  /// Add an exclusion for a remote asset from a local album
  Future<void> addExclusion(String remoteAssetId, String localAlbumId) async {
    await _db
        .into(_db.syncExclusionEntity)
        .insertOnConflictUpdate(
          SyncExclusionEntityCompanion(remoteAssetId: Value(remoteAssetId), localAlbumId: Value(localAlbumId)),
        );
  }

  /// Add multiple exclusions at once
  Future<void> addExclusions(List<String> remoteAssetIds, String localAlbumId) async {
    await _db.batch((batch) {
      for (final assetId in remoteAssetIds) {
        batch.insert(
          _db.syncExclusionEntity,
          SyncExclusionEntityCompanion(remoteAssetId: Value(assetId), localAlbumId: Value(localAlbumId)),
          mode: InsertMode.insertOrReplace,
        );
      }
    });
  }

  /// Remove an exclusion (e.g., if user moves asset back to original album)
  Future<void> removeExclusion(String remoteAssetId, String localAlbumId) async {
    await (_db.delete(
      _db.syncExclusionEntity,
    )..where((t) => t.remoteAssetId.equals(remoteAssetId) & t.localAlbumId.equals(localAlbumId))).go();
  }

  /// Get all remote asset IDs that should be excluded from a specific local album
  Future<Set<String>> getExcludedAssetIds(String localAlbumId) async {
    final query = _db.select(_db.syncExclusionEntity)..where((t) => t.localAlbumId.equals(localAlbumId));

    final results = await query.get();
    return results.map((e) => e.remoteAssetId).toSet();
  }

  /// Check if a specific asset is excluded from a local album
  Future<bool> isExcluded(String remoteAssetId, String localAlbumId) async {
    final query = _db.select(_db.syncExclusionEntity)
      ..where((t) => t.remoteAssetId.equals(remoteAssetId) & t.localAlbumId.equals(localAlbumId));

    final result = await query.getSingleOrNull();
    return result != null;
  }

  /// Clear all exclusions for a specific album
  Future<void> clearAlbumExclusions(String localAlbumId) async {
    await (_db.delete(_db.syncExclusionEntity)..where((t) => t.localAlbumId.equals(localAlbumId))).go();
  }

  /// Clear all exclusions (for debugging/reset purposes)
  Future<void> clearAll() async {
    await _db.delete(_db.syncExclusionEntity).go();
  }
}
