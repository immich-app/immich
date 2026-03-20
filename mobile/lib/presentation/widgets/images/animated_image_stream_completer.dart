import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart' show InformationCollector;
import 'package:flutter/painting.dart';
import 'package:immich_mobile/presentation/widgets/images/cache_aware_listener_tracker.mixin.dart';

/// A [MultiFrameImageStreamCompleter] with support for listener tracking
/// which makes resource cleanup possible when no longer needed.
/// Codec is disposed through the MultiFrameImageStreamCompleter's internals onDispose method
class AnimatedImageStreamCompleter extends MultiFrameImageStreamCompleter with CacheAwareListenerTrackerMixin {
  AnimatedImageStreamCompleter._({
    required super.codec,
    required super.scale,
    required bool hadInitialImage,
    super.informationCollector,
    void Function()? onLastListenerRemoved,
  }) {
    setupListenerTracking(hadInitialImage: hadInitialImage, onLastListenerRemoved: onLastListenerRemoved);
  }

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
      hadInitialImage: initialImage != null,
      informationCollector: informationCollector,
      onLastListenerRemoved: onLastListenerRemoved,
    );

    if (initialImage != null) {
      self.setImage(initialImage);
    }

    stream.listen(
      (item) {
        if (item is ImageInfo) {
          self.setImage(item);
        } else if (item is ui.Codec) {
          if (!codecCompleter.isCompleted) {
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
}
