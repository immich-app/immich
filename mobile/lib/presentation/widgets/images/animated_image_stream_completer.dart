import 'package:flutter/painting.dart';

/// A [MultiFrameImageStreamCompleter] with support for listener tracking
/// and resource cleanup when no listeners remain.
class AnimatedImageStreamCompleter extends MultiFrameImageStreamCompleter {
  void Function()? _onLastListenerRemoved;
  int _listenerCount = 0;
  bool didProvideImage = false;

  AnimatedImageStreamCompleter({
    required super.codec,
    required super.scale,
    super.informationCollector,
    void Function()? onLastListenerRemoved,
  }) : _onLastListenerRemoved = onLastListenerRemoved;

  @override
  void setImage(ImageInfo image) {
    didProvideImage = true;
    super.setImage(image);
  }

  @override
  void addListener(ImageStreamListener listener) {
    super.addListener(listener);
    _listenerCount = _listenerCount + 1;
  }

  @override
  void removeListener(ImageStreamListener listener) {
    super.removeListener(listener);
    _listenerCount = _listenerCount - 1;

    final bool onlyCacheListenerLeft = _listenerCount == 1 && !didProvideImage;
    final bool noListenersAfterImage = _listenerCount == 0 && didProvideImage;

    final onLastListenerRemoved = _onLastListenerRemoved;

    if (onLastListenerRemoved != null && (noListenersAfterImage || onlyCacheListenerLeft)) {
      _onLastListenerRemoved = null;
      onLastListenerRemoved();
    }
  }
}
