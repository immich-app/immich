// The below code is adapted from cached_network_image package's
// MultiImageStreamCompleter to better suit one-frame image loading.
// In particular, it allows providing an initial image to emit synchronously.

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';

/// An ImageStreamCompleter with support for loading multiple images.
class OneFramePlaceholderImageStreamCompleter extends ImageStreamCompleter {
  void Function()? _onLastListenerRemoved;
  int _listenerCount = 0;
  // True once setImage() has been called at least once.
  bool didProvideImage = false;

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
    if (initialImage != null) {
      didProvideImage = true;
      setImage(initialImage);
    }
    _onLastListenerRemoved = onLastListenerRemoved;
    images.listen(
      (image) {
        didProvideImage = true;
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
