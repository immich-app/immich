import 'dart:async';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:photo_manager/photo_manager.dart' show ThumbnailSize;

/// The local image provider for an asset
/// Only viable
class ImmichLocalThumbnailProvider
    extends ImageProvider<ImmichLocalThumbnailProvider> {
  final Asset asset;
  final int height;
  final int width;

  ImmichLocalThumbnailProvider({
    required this.asset,
    this.height = 256,
    this.width = 256,
  }) : assert(asset.local != null, 'Only usable when asset.local is set');

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<ImmichLocalThumbnailProvider> obtainKey(
    ImageConfiguration configuration,
  ) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImmichLocalThumbnailProvider key,
    ImageDecoderCallback decode,
  ) {
    final chunkEvents = StreamController<ImageChunkEvent>();
    return MultiImageStreamCompleter(
      codec: _codec(key.asset, decode, chunkEvents),
      scale: 1.0,
      chunkEvents: chunkEvents.stream,
      informationCollector: () sync* {
        yield ErrorDescription(asset.fileName);
      },
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<ui.Codec> _codec(
    Asset key,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async* {
    // Load a small thumbnail
    final thumbBytes = await asset.local?.thumbnailDataWithSize(
      const ThumbnailSize.square(32),
      quality: 75,
    );
    if (thumbBytes != null) {
      final buffer = await ui.ImmutableBuffer.fromUint8List(thumbBytes);
      final codec = await decode(buffer);
      yield codec;
    } else {
      debugPrint("Loading thumb for ${asset.fileName} failed");
    }

    final normalThumbBytes =
        await asset.local?.thumbnailDataWithSize(ThumbnailSize(width, height));
    if (normalThumbBytes == null) {
      throw StateError(
        "Loading thumb for local photo ${asset.fileName} failed",
      );
    }
    final buffer = await ui.ImmutableBuffer.fromUint8List(normalThumbBytes);
    final codec = await decode(buffer);
    yield codec;

    chunkEvents.close();
  }

  @override
  bool operator ==(Object other) {
    if (other is! ImmichLocalThumbnailProvider) return false;
    if (identical(this, other)) return true;
    return asset == other.asset;
  }

  @override
  int get hashCode => asset.hashCode;
}
