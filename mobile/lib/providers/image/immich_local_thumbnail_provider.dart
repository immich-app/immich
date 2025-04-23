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
        yield ErrorDescription(key.asset.fileName);
      },
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<ui.Codec> _codec(
    Asset assetData,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async* {
    final thumbBytes = await assetData.local
        ?.thumbnailDataWithSize(ThumbnailSize(width, height));
    if (thumbBytes == null) {
      chunkEvents.close();
      throw StateError(
        "Loading thumb for local photo ${asset.fileName} failed",
      );
    }

    try {
      final buffer = await ui.ImmutableBuffer.fromUint8List(thumbBytes);
      final codec = await decode(buffer);
      yield codec;
    } finally {
      chunkEvents.close();
    }
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is ImmichLocalThumbnailProvider) {
      return asset.id == other.asset.id && asset.localId == other.asset.localId;
    }
    return false;
  }

  @override
  int get hashCode => Object.hash(asset.id, asset.localId);
}
