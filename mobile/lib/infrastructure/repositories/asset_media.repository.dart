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
    return _onCancelled();
  }

  void _onCancelled();
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

    final Map<String, int> info = await thumbnailApi.requestImage(
      localId,
      requestId: requestId,
      width: width,
      height: height,
    );

    final address = info['pointer'];
    if (address == null) {
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

      final frame = await codec.getNextFrame();
      return ImageInfo(image: frame.image, scale: scale);
    } finally {
      malloc.free(pointer);
    }
  }

  @override
  Future<void> _onCancelled() {
    return thumbnailApi.cancelImageRequest(requestId);
  }
}

class RemoteImageRequest extends ImageRequest {
  static final log = Logger('RemoteImageRequest');
  static final cacheManager = RemoteImageCacheManager();
  static final client = HttpClient();
  String uri;
  Map<String, String> headers;
  HttpClientRequest? _request;

  RemoteImageRequest({required this.uri, required this.headers});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    try {
      // The DB calls made by the cache manager are a *massive* bottleneck (6+ seconds) with high concurrency.
      // Since it isn't possible to cancel these operations, we only prefer the cache when they can be avoided.
      // The DB hit is left as a fallback for offline use.
      final cachedFileBuffer = await _loadCachedFile(uri, inMemoryOnly: true);
      if (cachedFileBuffer != null) {
        return _decodeBuffer(cachedFileBuffer, decode, scale);
      }

      final buffer = await _downloadImage(uri);
      if (buffer == null || _isCancelled) {
        return null;
      }
      return await _decodeBuffer(buffer, decode, scale);
    } catch (e) {
      if (e is HttpException && (e.message.endsWith('aborted') || e.message.startsWith('Connection closed'))) {
        return null;
      }
      log.severe('Failed to load remote image', e);
      final buffer = await _loadCachedFile(uri, inMemoryOnly: false);
      if (buffer != null) {
        return _decodeBuffer(buffer, decode, scale);
      }
      rethrow;
    } finally {
      _request = null;
    }
  }

  Future<ImmutableBuffer?> _downloadImage(String url) async {
    final request = _request = await client.getUrl(Uri.parse(url));
    if (_isCancelled) {
      return null;
    }

    final headers = ApiService.getRequestHeaders();
    for (final entry in headers.entries) {
      request.headers.set(entry.key, entry.value);
    }
    final response = await request.close();
    if (_isCancelled) {
      return null;
    }

    final bytes = await consolidateHttpClientResponseBytes(response);
    _cacheFile(url, bytes);
    if (_isCancelled) {
      return null;
    }
    return await ImmutableBuffer.fromUint8List(bytes);
  }

  Future<void> _cacheFile(String url, Uint8List bytes) async {
    try {
      await cacheManager.putFile(url, bytes);
    } catch (e) {
      log.severe('Failed to cache image', e);
    }
  }

  Future<ImmutableBuffer?> _loadCachedFile(String url, {required bool inMemoryOnly}) async {
    if (_isCancelled) {
      return null;
    }
    final file = await (inMemoryOnly ? cacheManager.getFileFromMemory(url) : cacheManager.getFileFromCache(url));
    if (_isCancelled || file == null) {
      return null;
    }
    return await ImmutableBuffer.fromFilePath(file.file.path);
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
