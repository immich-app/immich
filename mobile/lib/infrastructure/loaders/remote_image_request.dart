part of 'image_request.dart';

class RemoteImageRequest extends ImageRequest {
  static final log = Logger('RemoteImageRequest');
  static final client = HttpClient()..maxConnectionsPerHost = 16;
  final RemoteCacheManager? cacheManager;
  final String uri;
  final Map<String, String> headers;
  HttpClientRequest? _request;

  RemoteImageRequest({required this.uri, required this.headers, this.cacheManager});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    // TODO: the cache manager makes everything sequential with its DB calls and its operations cannot be cancelled,
    //  so it ends up being a bottleneck.  We only prefer fetching from it when it can skip the DB call.
    final cachedFileImage = await _loadCachedFile(uri, decode, scale, inMemoryOnly: true);
    if (cachedFileImage != null) {
      return cachedFileImage;
    }

    try {
      final buffer = await _downloadImage(uri);
      if (buffer == null) {
        return null;
      }

      return await _decodeBuffer(buffer, decode, scale);
    } catch (e) {
      if (_isCancelled) {
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

    for (final entry in headers.entries) {
      request.headers.set(entry.key, entry.value);
    }
    final response = await request.close();
    if (_isCancelled) {
      return null;
    }
    final bytes = Uint8List(response.contentLength);
    int offset = 0;
    final subscription = response.listen((List<int> chunk) {
      // this is important to break the response stream if the request is cancelled
      if (_isCancelled) {
        throw StateError('Cancelled request');
      }
      bytes.setAll(offset, chunk);
      offset += chunk.length;
    }, cancelOnError: true);
    cacheManager?.putStreamedFile(url, response);
    await subscription.asFuture();
    return await ImmutableBuffer.fromUint8List(bytes);
  }

  Future<ImageInfo?> _loadCachedFile(
    String url,
    ImageDecoderCallback decode,
    double scale, {
    required bool inMemoryOnly,
  }) async {
    final cacheManager = this.cacheManager;
    if (_isCancelled || cacheManager == null) {
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
      await cacheManager?.removeFile(url);
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
