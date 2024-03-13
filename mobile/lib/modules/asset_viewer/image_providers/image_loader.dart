import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/shared/models/store.dart';

/// Loads the codec from the URI and sends the events to the [chunkEvents] stream
///
/// Credit to [flutter_cached_network_image](https://github.com/Baseflow/flutter_cached_network_image/blob/develop/cached_network_image/lib/src/image_provider/_image_loader.dart)
/// for this wonderful implementation of their image loader
class ImageLoader {
  static Future<ui.Codec> loadImageFromCache(
    Uri uri,
    ImageCacheManager cache,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async {
    final headers = {
      'x-immich-user-token': Store.get(StoreKey.accessToken),
    };

    final stream = cache.getImageFile(
      uri.toString(),
      withProgress: true,
      headers: headers,
    );

    await for (final result in stream) {
      if (result is DownloadProgress) {
        // We are downloading the file, so update the [chunkEvents]
        chunkEvents.add(
          ImageChunkEvent(
            cumulativeBytesLoaded: result.downloaded,
            expectedTotalBytes: result.totalSize,
          ),
        );
      }

      if (result is FileInfo) {
        // We have the file
        final file = result.file;
        final bytes = await file.readAsBytes();
        final buffer = await ui.ImmutableBuffer.fromUint8List(bytes);
        final decoded = await decode(buffer);
        return decoded;
      }
    }

    throw Exception('No file found in cache');
  }
}
