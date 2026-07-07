import 'dart:io';

import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// In-memory registry of files downloaded for offline albums.
///
/// Kept in sync with the offline_asset_entity table so image and video
/// providers can resolve local file paths synchronously during widget builds.
/// Lookups return null until [ensureInitialized] has run, in which case
/// callers fall back to the regular remote loading path.
class OfflineFileRegistry {
  OfflineFileRegistry._();

  static final OfflineFileRegistry instance = OfflineFileRegistry._();

  String? _directory;
  final Map<String, String> _originals = {};
  final Map<String, String> _thumbnails = {};

  bool get isInitialized => _directory != null;

  /// Absolute path of the directory holding offline asset files
  String? get directory => _directory;

  static Future<void> ensureInitialized(Drift db) async {
    final registry = instance;
    registry._directory ??= p.join((await getApplicationSupportDirectory()).path, kOfflineAssetsDirectory);

    registry._originals.clear();
    registry._thumbnails.clear();
    final rows = await db.offlineAssetEntity.select().get();
    for (final row in rows) {
      final fileName = row.fileName;
      if (fileName != null) {
        registry._originals[row.assetId] = fileName;
      }
      final thumbFileName = row.thumbFileName;
      if (thumbFileName != null) {
        registry._thumbnails[row.assetId] = thumbFileName;
      }
    }
  }

  String? getOriginalPath(String assetId) {
    final directory = _directory;
    final fileName = _originals[assetId];
    return directory == null || fileName == null ? null : p.join(directory, fileName);
  }

  String? getThumbnailPath(String assetId) {
    final directory = _directory;
    final fileName = _thumbnails[assetId];
    return directory == null || fileName == null ? null : p.join(directory, fileName);
  }

  bool hasOriginal(String assetId) => _originals.containsKey(assetId);

  bool hasThumbnail(String assetId) => _thumbnails.containsKey(assetId);

  void setOriginal(String assetId, String fileName) => _originals[assetId] = fileName;

  void setThumbnail(String assetId, String fileName) => _thumbnails[assetId] = fileName;

  Future<void> remove(String assetId) async {
    final originalPath = getOriginalPath(assetId);
    final thumbnailPath = getThumbnailPath(assetId);
    _originals.remove(assetId);
    _thumbnails.remove(assetId);
    for (final path in [originalPath, thumbnailPath]) {
      if (path == null) {
        continue;
      }
      final file = File(path);
      if (await file.exists()) {
        await file.delete();
      }
    }
  }
}
