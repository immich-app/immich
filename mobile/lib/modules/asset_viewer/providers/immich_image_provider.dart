import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:openapi/api.dart' as api;

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class ImmichImageProvider extends ImageProvider<Asset> {
  final Asset asset;
  final _httpClient = HttpClient()..autoUncompress = false;

  ImmichImageProvider({required this.asset});

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<Asset> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(asset);
  }

  @override
  ImageStreamCompleter loadImage(Asset key, ImageDecoderCallback decode) {
    final chunkEvents = StreamController<ImageChunkEvent>();
    return MultiFrameImageStreamCompleter(
      codec: _codec(key, decode, chunkEvents),
      scale: 1.0,
      chunkEvents: chunkEvents.stream,
    );
  }

  bool get _useLocal =>
      !asset.isRemote ||
      asset.isLocal && !Store.get(StoreKey.preferRemoteImage, false);

  bool get _useOriginal => AppSettingsEnum.loadOriginal.defaultValue;
  bool get _loadPreview => AppSettingsEnum.loadPreview.defaultValue;

  Future<ui.Codec> _codec(
    Asset key,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async {
    if (_useLocal) {
      return _loadLocalCodec(key, decode, chunkEvents);
    }

    // Load a preview to the chunk events
    if (_loadPreview) {
      final preview = getThumbnailUrl(asset, type: api.ThumbnailFormat.WEBP);
      unawaited(_loadFromUri(Uri.parse(preview), decode, chunkEvents));
    }

    // Load the final remote image
    if (_useOriginal) {
      // Load the original image
      final url = getImageUrl(asset);
      return _loadFromUri(Uri.parse(url), decode, chunkEvents);
    } else {
      // Load a webp version of the image
      final url = getThumbnailUrl(asset, type: api.ThumbnailFormat.JPEG);
      return _loadFromUri(Uri.parse(url), decode, chunkEvents);
    }
  }

  // Loads the codec from the URI and sends the events to the [chunkEvents] stream
  Future<ui.Codec> _loadFromUri(
    Uri uri,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async {
    final request = await _httpClient.getUrl(uri);
    request.headers.add(
      'x-immich-user-token',
      Store.get(StoreKey.accessToken),
    );
    final response = await request.close();
    // Chunks of the completed image can be shown
    final data = await consolidateHttpClientResponseBytes(
      response,
      onBytesReceived: (cumulative, total) {
        chunkEvents.add(
          ImageChunkEvent(
            cumulativeBytesLoaded: cumulative,
            expectedTotalBytes: total,
          ),
        );
      },
    );

    // Close the stream and decode it
    await chunkEvents.close();
    final buffer = await ui.ImmutableBuffer.fromUint8List(data);
    return decode(buffer);
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
    if (other is! ImmichImageProvider) return false;
    if (identical(this, other)) return true;
    return asset == other.asset;
  }

  @override
  int get hashCode => asset.hashCode;
}
