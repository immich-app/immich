import 'package:flutter/painting.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumb_hash_provider.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';

/// [ImageCache] that segments by image size so one class of image can't evict
/// another: full images ([_large]), normal thumbnails ([_small]), the dense
/// zoom-out tiles ([_tiny]) and thumbhashes ([_thumbhash]).
final class CustomImageCache implements ImageCache {
  final _thumbhash = ImageCache()..maximumSize = 0;
  final _small = ImageCache();
  final _large = ImageCache()..maximumSize = 5; // Maximum 5 images
  // Dense zoom-out grids show hundreds of tiny tiles per screen. They get their
  // own high-count tier so they don't evict normal thumbnails; bytes stay bounded
  // because each tile is only a few KB at these edges.
  final _tiny = ImageCache()
    ..maximumSize = 8000
    ..maximumSizeBytes = 96 << 20; // 96 MiB

  @override
  int get maximumSize => _small.maximumSize + _large.maximumSize + _tiny.maximumSize;

  @override
  int get maximumSizeBytes => _small.maximumSizeBytes + _large.maximumSizeBytes + _tiny.maximumSizeBytes;

  @override
  set maximumSize(int value) => _small.maximumSize = value;

  @override
  set maximumSizeBytes(int value) => _small.maximumSizeBytes = value;

  @override
  void clear() {
    _small.clear();
    _large.clear();
    _tiny.clear();
  }

  @override
  void clearLiveImages() {
    _small.clearLiveImages();
    _large.clearLiveImages();
    _tiny.clearLiveImages();
  }

  /// Gets the cache for the given key
  ImageCache _cacheForKey(Object key) {
    return switch (key) {
      LocalFullImageProvider() || RemoteFullImageProvider() => _large,
      ThumbHashProvider() => _thumbhash,
      RemoteImageProvider(:final decodeEdge?) when decodeEdge <= kTinyThumbnailMaxEdge => _tiny,
      LocalThumbProvider(:final size) when size.shortestSide <= kTinyThumbnailMaxEdge => _tiny,
      _ => _small,
    };
  }

  @override
  bool containsKey(Object key) {
    // [ImmichLocalImageProvider] and [ImmichRemoteImageProvider] are both
    // large size images while the other thumbnail providers are small
    return _cacheForKey(key).containsKey(key);
  }

  @override
  int get currentSize => _small.currentSize + _large.currentSize + _tiny.currentSize;

  @override
  int get currentSizeBytes => _small.currentSizeBytes + _large.currentSizeBytes + _tiny.currentSizeBytes;

  @override
  bool evict(Object key, {bool includeLive = true}) => _cacheForKey(key).evict(key, includeLive: includeLive);

  @override
  int get liveImageCount => _small.liveImageCount + _large.liveImageCount + _tiny.liveImageCount;

  @override
  int get pendingImageCount => _small.pendingImageCount + _large.pendingImageCount + _tiny.pendingImageCount;

  @override
  ImageStreamCompleter? putIfAbsent(
    Object key,
    ImageStreamCompleter Function() loader, {
    ImageErrorListener? onError,
  }) => _cacheForKey(key).putIfAbsent(key, loader, onError: onError);

  @override
  ImageCacheStatus statusForKey(Object key) => _cacheForKey(key).statusForKey(key);
}
