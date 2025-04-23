import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart' show ThumbnailSize;

/// The local image provider for an asset
class ImmichLocalImageProvider extends ImageProvider<ImmichLocalImageProvider> {
  final Asset asset;
  // only used for videos
  final double width;
  final double height;
  final Logger log = Logger('ImmichLocalImageProvider');

  ImmichLocalImageProvider({
    required this.asset,
    required this.width,
    required this.height,
  }) : assert(asset.local != null, 'Only usable when asset.local is set');

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<ImmichLocalImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImmichLocalImageProvider key,
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
    Asset asset,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async* {
    try {
      final local = asset.local;
      if (local == null) {
        throw StateError('Asset ${asset.fileName} has no local data');
      }

      switch (asset.type) {
        case AssetType.image:
          final File? file = await local.originFile;
          if (file == null) {
            throw StateError("Opening file for asset ${asset.fileName} failed");
          }
          final buffer = await ui.ImmutableBuffer.fromFilePath(file.path);
          yield await decode(buffer);
          break;
        case AssetType.video:
          final size = ThumbnailSize(width.ceil(), height.ceil());
          final thumbBytes = await local.thumbnailDataWithSize(size);
          if (thumbBytes == null) {
            throw StateError("Failed to load preview for ${asset.fileName}");
          }
          final buffer = await ui.ImmutableBuffer.fromUint8List(thumbBytes);
          yield await decode(buffer);
          break;
        default:
          throw StateError('Unsupported asset type ${asset.type}');
      }
    } catch (error, stack) {
      log.severe('Error loading local image ${asset.fileName}', error, stack);
    } finally {
      chunkEvents.close();
    }
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is ImmichLocalImageProvider) {
      return asset.id == other.asset.id && asset.localId == other.asset.localId;
    }
    return false;
  }

  @override
  int get hashCode => Object.hash(asset.id, asset.localId);
}
