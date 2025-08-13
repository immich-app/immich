import 'dart:async';
import 'dart:ffi';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/providers/image/cache/remote_image_cache_manager.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:ffi/ffi.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';

abstract class ImageRequest {
  static int _nextRequestId = 0;

  final int requestId = _nextRequestId++;
  bool _isCancelled = false;

  get isCancelled => _isCancelled;

  ImageRequest();

  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0});

  void cancel() {
    if (isCancelled) {
      return;
    }
    _isCancelled = true;
    if (!kReleaseMode) {
      debugPrint('Cancelling image request $requestId');
    }
    return _onCancelled();
  }

  void _onCancelled();

  Future<ui.FrameInfo?> _fromPlatformImage(Map<String, int> info) async {
    final address = info['pointer'];
    if (address == null) {
      if (!kReleaseMode) {
        debugPrint('Platform image request for $requestId was cancelled');
      }
      return null;
    }

    final pointer = Pointer<Uint8>.fromAddress(address);
    try {
      if (_isCancelled) {
        return null;
      }

      final actualWidth = info['width']!;
      final actualHeight = info['height']!;
      final actualSize = actualWidth * actualHeight * 4;

      final buffer = await ImmutableBuffer.fromUint8List(pointer.asTypedList(actualSize));
      if (_isCancelled) {
        return null;
      }

      final descriptor = ui.ImageDescriptor.raw(
        buffer,
        width: actualWidth,
        height: actualHeight,
        pixelFormat: ui.PixelFormat.rgba8888,
      );
      final codec = await descriptor.instantiateCodec();
      if (_isCancelled) {
        return null;
      }

      return await codec.getNextFrame();
    } finally {
      malloc.free(pointer);
    }
  }
}

class ThumbhashImageRequest extends ImageRequest {
  final String thumbhash;

  ThumbhashImageRequest({required this.thumbhash});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    Stopwatch? stopwatch;
    if (!kReleaseMode) {
      stopwatch = Stopwatch()..start();
    }
    final Map<String, int> info = await thumbnailApi.getThumbhash(thumbhash);
    if (!kReleaseMode) {
      stopwatch!.stop();
      debugPrint('Thumbhash request $requestId took ${stopwatch.elapsedMilliseconds} ms');
    }
    final frame = await _fromPlatformImage(info);
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  void _onCancelled() {}
}

class LocalImageRequest extends ImageRequest {
  final String localId;
  final int width;
  final int height;

  LocalImageRequest({required this.localId, required ui.Size size})
    : width = size.width.toInt(),
      height = size.height.toInt();

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    Stopwatch? stopwatch;
    if (!kReleaseMode) {
      stopwatch = Stopwatch()..start();
    }
    final Map<String, int> info = await thumbnailApi.requestImage(
      localId,
      requestId: requestId,
      width: width,
      height: height,
    );
    if (!kReleaseMode) {
      stopwatch!.stop();
      debugPrint('Local image request $requestId took ${stopwatch.elapsedMilliseconds} ms');
    }
    final frame = await _fromPlatformImage(info);
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  Future<void> _onCancelled() {
    return thumbnailApi.cancelImageRequest(requestId);
  }
}

class RemoteImageRequest extends ImageRequest {
  static final log = Logger('RemoteImageRequest');
  static final cacheManager = RemoteImageCacheManager();
  static final client = HttpClient()..maxConnectionsPerHost = 32;
  String uri;
  Map<String, String> headers;
  HttpClientRequest? _request;

  RemoteImageRequest({required this.uri, required this.headers});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    // TODO: the cache manager makes everything sequential with its DB calls and its operations cannot be cancelled,
    //  so it just makes things slower and more memory hungry. Even just saving files to disk
    //  for offline use adds too much overhead as these calls add up. We only prefer fetching from it when
    //  it can skip the DB call.
    final cachedFileImage = await _loadCachedFile(uri, decode, scale, inMemoryOnly: true);
    if (cachedFileImage != null) {
      return cachedFileImage;
    }

    try {
      Stopwatch? stopwatch;
      if (!kReleaseMode) {
        stopwatch = Stopwatch()..start();
      }
      final buffer = await _downloadImage(uri);
      if (buffer == null) {
        return null;
      }
      if (!kReleaseMode) {
        stopwatch!.stop();
        debugPrint('Remote image download request $requestId took ${stopwatch.elapsedMilliseconds} ms');
      }
      return await _decodeBuffer(buffer, decode, scale);
    } catch (e) {
      if (_isCancelled) {
        if (!kReleaseMode) {
          debugPrint('Remote image download request for $requestId was cancelled');
        }
        return null;
      }

      final cachedFileImage = await _loadCachedFile(uri, decode, scale, inMemoryOnly: false);
      if (cachedFileImage != null) {
        return cachedFileImage;
      }

      rethrow;
    } finally {
      _request = null;
    }
  }

  Future<ImmutableBuffer?> _downloadImage(String url) async {
    if (_isCancelled) {
      return null;
    }

    final request = _request = await client.getUrl(Uri.parse(url));
    if (_isCancelled) {
      request.abort();
      return _request = null;
    }

    final headers = ApiService.getRequestHeaders();
    for (final entry in headers.entries) {
      request.headers.set(entry.key, entry.value);
    }
    final response = await request.close();
    final bytes = await consolidateHttpClientResponseBytes(response);
    if (_isCancelled) {
      return null;
    }
    return await ImmutableBuffer.fromUint8List(bytes);
  }

  Future<ImageInfo?> _loadCachedFile(
    String url,
    ImageDecoderCallback decode,
    double scale, {
    required bool inMemoryOnly,
  }) async {
    if (_isCancelled) {
      return null;
    }

    final file = await (inMemoryOnly ? cacheManager.getFileFromMemory(url) : cacheManager.getFileFromCache(url));
    if (_isCancelled || file == null) {
      return null;
    }

    try {
      final buffer = await ImmutableBuffer.fromFilePath(file.file.path);
      return await _decodeBuffer(buffer, decode, scale);
    } catch (e) {
      log.severe('Failed to decode cached image', e);
      _evictFile(url);
      return null;
    }
  }

  Future<void> _evictFile(String url) async {
    try {
      await cacheManager.removeFile(url);
    } catch (e) {
      log.severe('Failed to remove cached image', e);
    }
  }

  Future<ImageInfo?> _decodeBuffer(ImmutableBuffer buffer, ImageDecoderCallback decode, scale) async {
    if (_isCancelled) {
      buffer.dispose();
      return null;
    }
    final codec = await decode(buffer);
    if (_isCancelled) {
      buffer.dispose();
      codec.dispose();
      return null;
    }
    final frame = await codec.getNextFrame();
    return ImageInfo(image: frame.image, scale: scale);
  }

  @override
  void _onCancelled() {
    _request?.abort();
    _request = null;
  }
}
