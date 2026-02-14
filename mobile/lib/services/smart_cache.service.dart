import 'dart:io';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/image/cache/remote_image_cache_manager.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';

class SmartCacheService {
  static final _log = Logger('SmartCacheService');
  static SmartCacheService? _instance;

  SmartCacheService._();

  factory SmartCacheService() {
    _instance ??= SmartCacheService._();
    return _instance!;
  }

  Future<void> runCleanupIfNeeded() async {
    final enabled = Store.get(StoreKey.smartCacheEnabled, true);
    if (!enabled) return;

    final lastCleanup = Store.tryGet<int>(StoreKey.smartCacheLastCleanup) ?? 0;
    final now = DateTime.now().millisecondsSinceEpoch;
    final oneDayMs = 24 * 60 * 60 * 1000;

    if (now - lastCleanup < oneDayMs) return;

    await cleanupExpiredHighResCache();
    await Store.put(StoreKey.smartCacheLastCleanup, now);
  }

  Future<void> cleanupExpiredHighResCache() async {
    try {
      final days = Store.get(StoreKey.smartCacheHighResDays, 7);
      final cutoff = DateTime.now().subtract(Duration(days: days));

      final cacheDir = await _getHighResCacheDirectory();
      if (cacheDir == null || !await cacheDir.exists()) return;

      final files = cacheDir.listSync(recursive: true);
      var cleanedCount = 0;
      var cleanedBytes = 0;

      for (final entity in files) {
        if (entity is File) {
          final stat = await entity.stat();
          if (stat.accessed.isBefore(cutoff)) {
            cleanedBytes += stat.size;
            await entity.delete();
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        _log.info('Cleaned $cleanedCount expired high-res cache files ($cleanedBytes bytes)');
      }
    } catch (e) {
      _log.warning('Failed to cleanup high-res cache: $e');
    }
  }

  Future<void> clearHighResCache() async {
    try {
      await RemoteImageCacheManager().emptyCache();
      _log.info('Cleared high-res cache');
    } catch (e) {
      _log.warning('Failed to clear high-res cache: $e');
    }
  }

  Future<void> clearAllCache() async {
    try {
      await RemoteImageCacheManager().emptyCache();
      await RemoteThumbnailCacheManager().emptyCache();
      _log.info('Cleared all cache');
    } catch (e) {
      _log.warning('Failed to clear all cache: $e');
    }
  }

  Future<SmartCacheStats> getCacheStats() async {
    var thumbnailSize = 0;
    var thumbnailCount = 0;
    var highResSize = 0;
    var highResCount = 0;

    try {
      final thumbnailDir = await _getThumbnailCacheDirectory();
      if (thumbnailDir != null && await thumbnailDir.exists()) {
        final stats = await _calculateDirectoryStats(thumbnailDir);
        thumbnailSize = stats.size;
        thumbnailCount = stats.count;
      }
    } catch (_) {}

    try {
      final highResDir = await _getHighResCacheDirectory();
      if (highResDir != null && await highResDir.exists()) {
        final stats = await _calculateDirectoryStats(highResDir);
        highResSize = stats.size;
        highResCount = stats.count;
      }
    } catch (_) {}

    return SmartCacheStats(
      thumbnailSize: thumbnailSize,
      thumbnailCount: thumbnailCount,
      highResSize: highResSize,
      highResCount: highResCount,
    );
  }

  Future<_DirStats> _calculateDirectoryStats(Directory dir) async {
    var size = 0;
    var count = 0;

    await for (final entity in dir.list(recursive: true)) {
      if (entity is File) {
        final stat = await entity.stat();
        size += stat.size;
        count++;
      }
    }

    return _DirStats(size, count);
  }

  Future<Directory?> _getHighResCacheDirectory() async {
    try {
      final cacheDir = await getTemporaryDirectory();
      return Directory('${cacheDir.path}/${RemoteImageCacheManager.key}');
    } catch (_) {
      return null;
    }
  }

  Future<Directory?> _getThumbnailCacheDirectory() async {
    try {
      final cacheDir = await getTemporaryDirectory();
      return Directory('${cacheDir.path}/${RemoteThumbnailCacheManager.key}');
    } catch (_) {
      return null;
    }
  }
}

class _DirStats {
  final int size;
  final int count;

  _DirStats(this.size, this.count);
}

class SmartCacheStats {
  final int thumbnailSize;
  final int thumbnailCount;
  final int highResSize;
  final int highResCount;

  SmartCacheStats({
    required this.thumbnailSize,
    required this.thumbnailCount,
    required this.highResSize,
    required this.highResCount,
  });

  int get totalSize => thumbnailSize + highResSize;
  int get totalCount => thumbnailCount + highResCount;
}
