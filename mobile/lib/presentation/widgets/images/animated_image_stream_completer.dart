import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart' show InformationCollector;
import 'package:flutter/painting.dart';

/// A [MultiFrameImageStreamCompleter] with support for listener tracking
/// which makes resource cleanup possible when no longer needed.
/// Codec is disposed through the MultiFrameImageStreamCompleter's internals onDispose method
class AnimatedImageStreamCompleter extends MultiFrameImageStreamCompleter {
  void Function()? _onLastListenerRemoved;
  int _listenerCount = 0;
  // True once any image or the codec has been provided.
  // Until then the image cache holds one listener, so "last real listener gone"
  // is _listenerCount == 1, not 0.
  bool didProvideImage = false;

  AnimatedImageStreamCompleter._({
    required super.codec,
    required super.scale,
    super.informationCollector,
    void Function()? onLastListenerRemoved,
  }) : _onLastListenerRemoved = onLastListenerRemoved;

  factory AnimatedImageStreamCompleter({
    required Stream<Object> stream,
    required double scale,
    ImageInfo? initialImage,
    InformationCollector? informationCollector,
    void Function()? onLastListenerRemoved,
  }) {
    final codecCompleter = Completer<ui.Codec>();
    final self = AnimatedImageStreamCompleter._(
      codec: codecCompleter.future,
      scale: scale,
      informationCollector: informationCollector,
      onLastListenerRemoved: onLastListenerRemoved,
    );

    if (initialImage != null) {
      self.didProvideImage = true;
      self.setImage(initialImage);
    }

    stream.listen(
      (item) {
        if (item is ImageInfo) {
          self.didProvideImage = true;
          self.setImage(item);
        } else if (item is ui.Codec) {
          if (!codecCompleter.isCompleted) {
            self.didProvideImage = true;
            codecCompleter.complete(item);
          }
        }
      },
      onError: (Object error, StackTrace stack) {
        if (!codecCompleter.isCompleted) {
          codecCompleter.completeError(error, stack);
        }
      },
      onDone: () {
        // also complete if we are done but no error occurred, and we didn't call complete yet
        // could happen on cancellation
        if (!codecCompleter.isCompleted) {
          codecCompleter.completeError(StateError('Stream closed without providing a codec'));
        }
      },
    );

    return self;
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

    final bool onlyCacheListenerLeft = _listenerCount == 1 && !didProvideImage;
    final bool noListenersAfterCodec = _listenerCount == 0 && didProvideImage;

    if (onlyCacheListenerLeft || noListenersAfterCodec) {
      final onLastListenerRemoved = _onLastListenerRemoved;
      if (onLastListenerRemoved != null) {
        _onLastListenerRemoved = null;
        onLastListenerRemoved();
      }
    }
  }
}
