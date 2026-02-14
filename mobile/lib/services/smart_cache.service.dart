import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:logging/logging.dart';

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

    final maxAgeDays = Store.get(StoreKey.smartCacheHighResDays, 7);
    
    if (maxAgeDays > 0) {
      try {
        final cleared = await remoteImageApi.cleanupExpiredHighRes(maxAgeDays);
        _log.info('Cleaned up expired high-res cache: $cleared bytes');
      } catch (e) {
        _log.warning('Failed to cleanup high-res cache: $e');
      }
    }

    await Store.put(StoreKey.smartCacheLastCleanup, now);
  }

  Future<void> clearHighResCache() async {
    try {
      await remoteImageApi.clearHighResCache();
      _log.info('Cleared high-res cache');
    } catch (e) {
      _log.warning('Failed to clear high-res cache: $e');
    }
  }

  Future<void> clearAllCache() async {
    try {
      await remoteImageApi.clearThumbnailCache();
      await remoteImageApi.clearHighResCache();
      _log.info('Cleared all cache');
    } catch (e) {
      _log.warning('Failed to clear all cache: $e');
    }
  }

  Future<SmartCacheStats> getCacheStats() async {
    try {
      final stats = await remoteImageApi.getDualCacheStats();
      return SmartCacheStats(
        thumbnailSize: stats.thumbnailSize,
        thumbnailCount: stats.thumbnailCount,
        highResSize: stats.highResSize,
        highResCount: stats.highResCount,
      );
    } catch (e) {
      _log.warning('Failed to get cache stats: $e');
      return SmartCacheStats(
        thumbnailSize: 0,
        thumbnailCount: 0,
        highResSize: 0,
        highResCount: 0,
      );
    }
  }
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
