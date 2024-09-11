import 'package:flutter/painting.dart';
import 'package:immich_mobile/providers/image/immich_local_image_provider.dart';
import 'package:immich_mobile/providers/image/immich_local_thumbnail_provider.dart';
import 'package:immich_mobile/providers/image/immich_remote_image_provider.dart';
import 'package:immich_mobile/providers/image/immich_remote_thumbnail_provider.dart';

/// [ImageCache] that uses two caches for small and large images
/// so that a single large image does not evict all small iamges
final class CustomImageCache implements ImageCache {
  final _small = ImageCache();
  final _large = ImageCache()..maximumSize = 5; // Maximum 5 images

  @override
  int get maximumSize => _small.maximumSize + _large.maximumSize;

  @override
  int get maximumSizeBytes => _small.maximumSizeBytes + _large.maximumSizeBytes;

  @override
  set maximumSize(int value) => _small.maximumSize = value;

  @override
  set maximumSizeBytes(int value) => _small.maximumSize = value;

  @override
  void clear() {
    _small.clear();
    _large.clear();
  }

  @override
  void clearLiveImages() {
    _small.clearLiveImages();
    _large.clearLiveImages();
  }

  /// Gets the cache for the given key
  /// [_large] is used for [ImmichLocalImageProvider] and [ImmichRemoteImageProvider]
  /// [_small] is used for [ImmichLocalThumbnailProvider] and [ImmichRemoteThumbnailProvider]
  ImageCache _cacheForKey(Object key) =>
      (key is ImmichLocalImageProvider || key is ImmichRemoteImageProvider)
          ? _large
          : _small;

  @override
  bool containsKey(Object key) {
    // [ImmichLocalImageProvider] and [ImmichRemoteImageProvider] are both
    // large size images while the other thumbnail providers are small
    return _cacheForKey(key).containsKey(key);
  }

  @override
  int get currentSize => _small.currentSize + _large.currentSize;

  @override
  int get currentSizeBytes => _small.currentSizeBytes + _large.currentSizeBytes;

  @override
  bool evict(Object key, {bool includeLive = true}) =>
      _cacheForKey(key).evict(key, includeLive: includeLive);

  @override
  int get liveImageCount => _small.liveImageCount + _large.liveImageCount;

  @override
  int get pendingImageCount =>
      _small.pendingImageCount + _large.pendingImageCount;

  @override
  ImageStreamCompleter? putIfAbsent(
    Object key,
    ImageStreamCompleter Function() loader, {
    ImageErrorListener? onError,
  }) =>
      _cacheForKey(key).putIfAbsent(key, loader, onError: onError);

  @override
  ImageCacheStatus statusForKey(Object key) =>
      _cacheForKey(key).statusForKey(key);
}
