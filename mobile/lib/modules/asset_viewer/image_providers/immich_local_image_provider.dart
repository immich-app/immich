import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:openapi/api.dart' as api;

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class ImmichLocalImageProvider extends ImageProvider<Asset> {
  final Asset asset;
  final _httpClient = HttpClient()..autoUncompress = false;

  ImmichLocalImageProvider({required this.asset});

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<Asset> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(asset);
  }

  @override
  ImageStreamCompleter loadImage(Asset key, ImageDecoderCallback decode) {
    final chunkEvents = StreamController<ImageChunkEvent>();
    return MultiImageStreamCompleter(
      codec: _codec(key, decode, chunkEvents),
      scale: 1.0,
      chunkEvents: chunkEvents.stream,
    );
  }

  bool get _useOriginal => AppSettingsEnum.loadOriginal.defaultValue;
  bool get _loadPreview => AppSettingsEnum.loadPreview.defaultValue;

  // Streams in each stage of the image as we ask for it
  Stream<ui.Codec> _codec(
    Asset key,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async* {
    if (_loadPreview) {
      // TODO: Use local preview
    }
    yield await _loadLocalCodec(key, decode, chunkEvents);
  }

  /// The local codec for local images
  Future<ui.Codec> _loadLocalCodec(
    Asset key,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
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
    if (other is! ImmichLocalImageProvider) return false;
    if (identical(this, other)) return true;
    return asset == other.asset;
  }

  @override
  int get hashCode => asset.hashCode;
}
