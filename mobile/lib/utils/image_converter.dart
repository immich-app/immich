import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;

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
          info.image.toByteData(format: ui.ImageByteFormat.png).then((byteData) {
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

/// Resolves a Flutter [Image] widget to a [ui.Image].
Future<ui.Image> resolveUiImage(Image image) {
  final completer = Completer<ui.Image>();
  image.image
      .resolve(ImageConfiguration.empty)
      .addListener(
        ImageStreamListener((ImageInfo info, bool _) {
          completer.complete(info.image);
        }),
      );
  return completer.future;
}

/// Applies a [ColorFilter] to an [Image] and returns a new [Image] with the filter baked in.
Future<Image> applyColorFilterToImage(Image image, ColorFilter filter) async {
  final uiImage = await resolveUiImage(image);
  final size = Size(uiImage.width.toDouble(), uiImage.height.toDouble());
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  final paint = Paint()..colorFilter = filter;
  canvas.drawImage(uiImage, Offset.zero, paint);
  final filteredImage = await recorder.endRecording().toImage(size.width.round(), size.height.round());
  final byteData = await filteredImage.toByteData(format: ui.ImageByteFormat.png);
  return Image.memory(byteData!.buffer.asUint8List(), fit: BoxFit.contain);
}
