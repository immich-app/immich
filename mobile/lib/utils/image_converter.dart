import 'dart:async';
import 'dart:typed_data';
import 'dart:ui';

import 'package:flutter/material.dart';

/// Converts a Flutter [Image] widget to a [Uint8List] in PNG format.
///
/// This function resolves the image stream and converts it to byte data.
/// Returns a [Future] that completes with the image bytes or completes with an error
/// if the conversion fails.
Future<Uint8List> imageToUint8List(Image image) async {
  final Completer<Uint8List> completer = Completer();
  image.image
      .resolve(const ImageConfiguration())
      .addListener(
        ImageStreamListener((ImageInfo info, bool _) {
          info.image.toByteData(format: ImageByteFormat.png).then((byteData) {
            if (byteData != null) {
              completer.complete(byteData.buffer.asUint8List());
            } else {
              completer.completeError('Failed to convert image to bytes');
            }
          });
        }, onError: (exception, stackTrace) => completer.completeError(exception)),
      );
  return completer.future;
}
