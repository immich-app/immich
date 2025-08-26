import 'package:flutter_cache_manager/flutter_cache_manager.dart';
// ignore: implementation_imports
import 'package:flutter_cache_manager/src/cache_store.dart';
import 'package:logging/logging.dart';
import 'package:uuid/uuid.dart';

abstract class RemoteCacheManager extends CacheManager {
  static final _log = Logger('RemoteCacheManager');

  RemoteCacheManager.custom(super.config, CacheStore store)
    // Unfortunately, CacheStore is not a public API
    // ignore: invalid_use_of_visible_for_testing_member
    : super.custom(cacheStore: store);

  Future<void> putStreamedFile(
    String url,
    Stream<List<int>> source, {
    String? key,
    String? eTag,
    Duration maxAge = const Duration(days: 30),
    String fileExtension = 'file',
  });

  // Unlike `putFileStream`, this method handles request cancellation,
  // does not make a (slow) DB call checking if the file is already cached,
  // does not synchronously check if a file exists,
  // and deletes the file on cancellation without making these checks again.
  Future<void> putStreamedFileToStore(
    CacheStore store,
    String url,
    Stream<List<int>> source, {
    String? key,
    String? eTag,
    Duration maxAge = const Duration(days: 30),
    String fileExtension = 'file',
  }) async {
    final path = '${const Uuid().v1()}.$fileExtension';
    final file = await store.fileSystem.createFile(path);
    final sink = file.openWrite();
    try {
      await source.listen(sink.add, cancelOnError: true).asFuture();
    } catch (e) {
      try {
        await sink.close();
        await file.delete();
      } catch (e) {
        _log.severe('Failed to delete incomplete cache file: $e');
      }
      return;
    }

    try {
      await sink.flush();
      await sink.close();
    } catch (e) {
      try {
        await file.delete();
      } catch (e) {
        _log.severe('Failed to delete incomplete cache file: $e');
      }
      return;
    }

    final cacheObject = CacheObject(
      url,
      key: key,
      relativePath: path,
      validTill: DateTime.now().add(maxAge),
      eTag: eTag,
    );
    try {
      await store.putFile(cacheObject);
    } catch (e) {
      try {
        await file.delete();
      } catch (e) {
        _log.severe('Failed to delete untracked cache file: $e');
      }
    }
  }
}

class RemoteImageCacheManager extends RemoteCacheManager {
  static const key = 'remoteImageCacheKey';
  static final RemoteImageCacheManager _instance = RemoteImageCacheManager._();
  static final _config = Config(key, maxNrOfCacheObjects: 500, stalePeriod: const Duration(days: 30));
  static final _store = CacheStore(_config);

  factory RemoteImageCacheManager() {
    return _instance;
  }

  RemoteImageCacheManager._() : super.custom(_config, _store);

  @override
  Future<void> putStreamedFile(
    String url,
    Stream<List<int>> source, {
    String? key,
    String? eTag,
    Duration maxAge = const Duration(days: 30),
    String fileExtension = 'file',
  }) {
    return putStreamedFileToStore(
      _store,
      url,
      source,
      key: key,
      eTag: eTag,
      maxAge: maxAge,
      fileExtension: fileExtension,
    );
  }
}

/// The cache manager for full size images [ImmichRemoteImageProvider]
class RemoteThumbnailCacheManager extends RemoteCacheManager {
  static const key = 'remoteThumbnailCacheKey';
  static final RemoteThumbnailCacheManager _instance = RemoteThumbnailCacheManager._();
  static final _config = Config(key, maxNrOfCacheObjects: 5000, stalePeriod: const Duration(days: 30));
  static final _store = CacheStore(_config);

  factory RemoteThumbnailCacheManager() {
    return _instance;
  }

  RemoteThumbnailCacheManager._() : super.custom(_config, _store);

  @override
  Future<void> putStreamedFile(
    String url,
    Stream<List<int>> source, {
    String? key,
    String? eTag,
    Duration maxAge = const Duration(days: 30),
    String fileExtension = 'file',
  }) {
    return putStreamedFileToStore(
      _store,
      url,
      source,
      key: key,
      eTag: eTag,
      maxAge: maxAge,
      fileExtension: fileExtension,
    );
  }
}
