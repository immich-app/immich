// The below code is adapted from cached_network_image package's
// MultiImageStreamCompleter to better suit one-frame image loading.
// In particular, it allows providing an initial image to emit synchronously.

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';

/// An ImageStreamCompleter with support for loading multiple images.
class OneFramePlaceholderImageStreamCompleter extends ImageStreamCompleter {
  ImageInfo? _initialImage;

  /// The constructor to create an OneFramePlaceholderImageStreamCompleter. The [image]
  /// should be the primary image to display. The [initialImage] is an optional
  /// image that will be emitted synchronously, useful as a thumbnail or placeholder.
  OneFramePlaceholderImageStreamCompleter(
    Stream<ImageInfo> image, {
    ImageInfo? initialImage,
    InformationCollector? informationCollector,
  }) {
    _initialImage = initialImage;
    image.listen(
      setImage,
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

  /// We must avoid disposing a completer if it never had a listener, even
  /// if all [keepAlive] handles get disposed.
  bool __hadAtLeastOneListener = false;

  bool __disposed = false;

  @override
  void addListener(ImageStreamListener listener) {
    __hadAtLeastOneListener = true;
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
  void removeListener(ImageStreamListener listener) {
    super.removeListener(listener);
    if (!hasListeners) {
      __maybeDispose();
    }
  }

  int __keepAliveHandles = 0;

  @override
  ImageStreamCompleterHandle keepAlive() {
    final delegateHandle = super.keepAlive();
    return _OneFramePlaceholderImageStreamCompleterHandle(this, delegateHandle);
  }

  void __maybeDispose() {
    if (!__hadAtLeastOneListener || __disposed || hasListeners || __keepAliveHandles != 0) {
      return;
    }

    __disposed = true;
  }

  @override
  void onDisposed() {
    _initialImage?.dispose();
    _initialImage = null;
    super.onDisposed();
  }
}

class _OneFramePlaceholderImageStreamCompleterHandle implements ImageStreamCompleterHandle {
  _OneFramePlaceholderImageStreamCompleterHandle(this._completer, this._delegateHandle) {
    _completer!.__keepAliveHandles += 1;
  }

  OneFramePlaceholderImageStreamCompleter? _completer;
  final ImageStreamCompleterHandle _delegateHandle;

  /// Call this method to signal the [ImageStreamCompleter] that it can now be
  /// disposed when its last listener drops.
  ///
  /// This method must only be called once per object.
  @override
  void dispose() {
    assert(_completer != null);
    assert(_completer!.__keepAliveHandles > 0);
    assert(!_completer!.__disposed);

    _delegateHandle.dispose();

    _completer!.__keepAliveHandles -= 1;
    _completer!.__maybeDispose();
    _completer = null;
  }
}
