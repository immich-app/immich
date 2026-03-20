import 'package:flutter/painting.dart';

/// A mixin that provides listener tracking for ImageStreamCompleters
/// protecting against synchronous cache drops and background memory pressure.
mixin CacheAwareListenerTrackerMixin on ImageStreamCompleter {
  void Function()? _onLastListenerRemoved;
  int _listenerCount = 0;
  bool _hadInitialImage = false;
  bool _hasIgnoredFirstSyncRemoval = false;
  ImageStreamListener? _cacheListener;
  bool _hasIdentifiedCacheListener = false;

  /// Subclasses can set this to true when they provided an image
  /// Not necessary when using setImage
  bool didProvideImage = false;

  /// Initializes the tracking state. Must be called in the subclass constructor.
  void setupListenerTracking({required bool hadInitialImage, void Function()? onLastListenerRemoved}) {
    _hadInitialImage = hadInitialImage;
    _onLastListenerRemoved = onLastListenerRemoved;
  }

  @override
  void setImage(ImageInfo image) {
    didProvideImage = true;
    super.setImage(image);
  }

  @override
  void addListener(ImageStreamListener listener) {
    if (!_hasIdentifiedCacheListener) {
      _hasIdentifiedCacheListener = true;
      _cacheListener = listener;
    }

    _listenerCount++;
    super.addListener(listener);
  }

  @override
  void removeListener(ImageStreamListener listener) {
    super.removeListener(listener);
    _listenerCount--;

    final bool isCacheListener = listener == _cacheListener;
    if (isCacheListener) {
      _cacheListener = null;
    }

    if (_hadInitialImage && !_hasIgnoredFirstSyncRemoval && isCacheListener) {
      _hasIgnoredFirstSyncRemoval = true;
      return;
    }

    final bool onlyCacheListenerLeft = _listenerCount == 1 && _cacheListener != null && !didProvideImage;

    final bool completelyAbandoned = _listenerCount == 0;

    if (onlyCacheListenerLeft || completelyAbandoned) {
      final onLastListenerRemoved = _onLastListenerRemoved;
      if (onLastListenerRemoved != null) {
        _onLastListenerRemoved = null;
        onLastListenerRemoved();
      }
    }
  }
}
