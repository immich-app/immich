// The below code is adapted from cached_network_image package's
// MultiImageStreamCompleter to better suit one-frame image loading.
// In particular, it allows providing an initial image to emit synchronously.

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';

/// An ImageStreamCompleter with support for loading multiple images.
class OneFramePlaceholderImageStreamCompleter extends ImageStreamCompleter {
  ImageInfo? _initialImage;

  /// The constructor to create an OneFramePlaceholderImageStreamCompleter. The [images]
  /// should be the primary images to display (typically asynchronously as they load).
  /// The [initialImage] is an optional image that will be emitted synchronously
  /// until the first stream image is completed, useful as a thumbnail or placeholder.
  OneFramePlaceholderImageStreamCompleter(
    Stream<ImageInfo> images, {
    ImageInfo? initialImage,
    InformationCollector? informationCollector,
  }) {
    _initialImage = initialImage;
    images.listen(
      _onImage,
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

  void _onImage(ImageInfo image) {
    setImage(image);
    _initialImage?.dispose();
    _initialImage = null;
  }

  @override
  void addListener(ImageStreamListener listener) {
    final initialImage = _initialImage;
    if (initialImage != null) {
      try {
        listener.onImage(initialImage.clone(), true);
      } catch (exception, stack) {
        reportError(
          context: ErrorDescription('by a synchronously-called image listener'),
          exception: exception,
          stack: stack,
        );
      }
    }
    super.addListener(listener);
  }

  @override
  void onDisposed() {
    _initialImage?.dispose();
    _initialImage = null;
    super.onDisposed();
  }
}
