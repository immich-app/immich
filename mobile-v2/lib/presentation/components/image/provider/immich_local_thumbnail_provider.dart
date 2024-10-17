import 'dart:async';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/constants/globals.dart';

/// The local image provider for an asset
/// Only viable
class ImLocalThumbnailProvider extends ImageProvider<ImLocalThumbnailProvider> {
  final Asset asset;
  final int height;
  final int width;

  ImLocalThumbnailProvider({
    required this.asset,
    this.height = kGridThumbnailSize,
    this.width = kGridThumbnailSize,
  }) : assert(asset.localId != null, 'Only usable when asset.local is set');

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<ImLocalThumbnailProvider> obtainKey(
    ImageConfiguration configuration,
  ) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImLocalThumbnailProvider key,
    ImageDecoderCallback decode,
  ) {
    final chunkEvents = StreamController<ImageChunkEvent>();
    return MultiImageStreamCompleter(
      codec: _codec(key.asset, decode, chunkEvents),
      scale: 1.0,
      chunkEvents: chunkEvents.stream,
      informationCollector: () sync* {
        yield ErrorDescription(asset.name);
      },
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<ui.Codec> _codec(
    Asset a,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async* {
    // Load a small thumbnail
    final thumbBytes = await di<IDeviceAssetRepository>()
        .getThumbnail(a.localId!, width: 32, height: 32, quality: 75);
    if (thumbBytes != null) {
      final buffer = await ui.ImmutableBuffer.fromUint8List(thumbBytes);
      final codec = await decode(buffer);
      yield codec;
    } else {
      debugPrint("Loading thumb for ${a.name} failed");
    }

    final normalThumbBytes = await di<IDeviceAssetRepository>()
        .getThumbnail(a.localId!, width: width, height: height);
    if (normalThumbBytes == null) {
      throw StateError("Loading thumb for local photo ${a.name} failed");
    }
    final buffer = await ui.ImmutableBuffer.fromUint8List(normalThumbBytes);
    final codec = await decode(buffer);
    yield codec;

    await chunkEvents.close();
  }

  @override
  bool operator ==(Object other) {
    if (other is! ImLocalThumbnailProvider) return false;
    if (identical(this, other)) return true;
    return asset == other.asset;
  }

  @override
  int get hashCode => asset.hashCode;
}
