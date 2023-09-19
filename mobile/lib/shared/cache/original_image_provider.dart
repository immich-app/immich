import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/shared/models/asset.dart';

/// Loads the original image for local assets
@immutable
final class OriginalImageProvider extends ImageProvider<OriginalImageProvider> {
  final Asset asset;

  const OriginalImageProvider(this.asset);

  @override
  Future<OriginalImageProvider> obtainKey(ImageConfiguration configuration) =>
      SynchronousFuture<OriginalImageProvider>(this);

  @override
  ImageStreamCompleter loadImage(
    OriginalImageProvider key,
    ImageDecoderCallback decode,
  ) =>
      MultiFrameImageStreamCompleter(
        codec: _loadAsync(key, decode),
        scale: 1.0,
        informationCollector: () sync* {
          yield ErrorDescription(asset.fileName);
        },
      );

  Future<ui.Codec> _loadAsync(
    OriginalImageProvider key,
    ImageDecoderCallback decode,
  ) async {
    final ui.ImmutableBuffer buffer;
    if (asset.isImage) {
      final File? file = await asset.local?.originFile;
      if (file == null) {
        throw StateError("Opening file for asset ${asset.fileName} failed");
      }
      try {
        buffer = await ui.ImmutableBuffer.fromFilePath(file.path);
      } catch (error) {
        throw StateError("Loading asset ${asset.fileName} failed");
      }
    } else {
      final thumbBytes = await asset.local?.thumbnailData;
      if (thumbBytes == null) {
        throw StateError("Loading thumb for video ${asset.fileName} failed");
      }
      buffer = await ui.ImmutableBuffer.fromUint8List(thumbBytes);
    }
    try {
      final codec = await decode(buffer);
      debugPrint("Decoded image ${asset.fileName}");
      return codec;
    } catch (error) {
      throw StateError("Decoding asset ${asset.fileName} failed");
    }
  }

  @override
  bool operator ==(Object other) {
    if (other is! OriginalImageProvider) return false;
    if (identical(this, other)) return true;
    return asset == other.asset;
  }

  @override
  int get hashCode => asset.hashCode;
}
