// The below code is adapted from cached_network_image package's
// MultiImageStreamCompleter to better suit one-frame image loading.
// In particular, it allows providing an initial image to emit synchronously.

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/presentation/widgets/images/cache_aware_listener_tracker.mixin.dart';

/// An ImageStreamCompleter with support for loading multiple images.
class OneFramePlaceholderImageStreamCompleter extends ImageStreamCompleter with CacheAwareListenerTrackerMixin {
  /// The constructor to create an OneFramePlaceholderImageStreamCompleter. The [images]
  /// should be the primary images to display (typically asynchronously as they load).
  /// The [initialImage] is an optional image that will be emitted synchronously
  /// until the first stream image is completed, useful as a thumbnail or placeholder.
  OneFramePlaceholderImageStreamCompleter(
    Stream<ImageInfo> images, {
    ImageInfo? initialImage,
    InformationCollector? informationCollector,
    void Function()? onLastListenerRemoved,
  }) {
    setupListenerTracking(hadInitialImage: initialImage != null, onLastListenerRemoved: onLastListenerRemoved);

    if (initialImage != null) {
      setImage(initialImage);
    }

    images.listen(
      (image) {
        setImage(image);
      },
      onError: (Object error, StackTrace stack) {
        reportError(
          context: ErrorDescription('resolving a single-frame image stream'),
          exception: error,
          stack: stack,
          informationCollector: informationCollector,
          silent: true,
        );
      },
    );
  }
}
