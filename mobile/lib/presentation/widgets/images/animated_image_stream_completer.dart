import 'dart:ui' as ui;

import 'package:flutter/painting.dart';

/// A [MultiFrameImageStreamCompleter] with support for listener tracking
/// which makes resource cleanup possible when no longer needed.
/// Codec is disposed through the MultiFrameImageStreamCompleter's internals onDispose method
class AnimatedImageStreamCompleter extends MultiFrameImageStreamCompleter {
  void Function()? _onLastListenerRemoved;
  int _listenerCount = 0;
  // True once the codec future has resolved (i.e. first frame can be decoded).
  // Until then the image cache holds one listener, so "last real listener gone"
  // is _listenerCount == 1, not 0.
  bool _didCodecFire = false;

  AnimatedImageStreamCompleter({
    required Future<ui.Codec> codec,
    required super.scale,
    super.informationCollector,
    void Function()? onLastListenerRemoved,
  }) : _onLastListenerRemoved = onLastListenerRemoved,
       super(codec: codec) {
    codec.then((_) => _didCodecFire = true);
  }

  @override
  void addListener(ImageStreamListener listener) {
    super.addListener(listener);
    _listenerCount++;
  }

  @override
  void removeListener(ImageStreamListener listener) {
    super.removeListener(listener);
    _listenerCount--;

    final bool onlyCacheListenerLeft = _listenerCount == 1 && !_didCodecFire;
    final bool noListenersAfterCodec = _listenerCount == 0 && _didCodecFire;

    if (onlyCacheListenerLeft || noListenersAfterCodec) {
      final onLastListenerRemoved = _onLastListenerRemoved;
      if (onLastListenerRemoved != null) {
        _onLastListenerRemoved = null;
        onLastListenerRemoved();
      }
    }
  }
}
