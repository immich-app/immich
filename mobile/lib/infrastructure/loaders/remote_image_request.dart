part of 'image_request.dart';

class RemoteImageRequest extends ImageRequest {
  static final _client = const NetworkRepository().getHttpClient(
    directoryName: 'thumbnails',
    diskCapacity: kThumbnailDiskCacheSize,
    memoryCapacity: 0,
    maxConnections: 16,
    cacheMode: CacheMode.disk,
  );
  final String uri;
  final Map<String, String> headers;
  final abortTrigger = Completer<void>();

  RemoteImageRequest({required this.uri, required this.headers});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    try {
      final buffer = await _downloadImage();
      if (buffer == null) {
        return null;
      }

      return await _decodeBuffer(buffer, decode, scale);
    } catch (e) {
      if (_isCancelled) {
        return null;
      }

      rethrow;
    }
  }

  Future<ImmutableBuffer?> _downloadImage() async {
    if (_isCancelled) {
      return null;
    }

    final req = http.AbortableRequest('GET', Uri.parse(uri), abortTrigger: abortTrigger.future);
    req.headers.addAll(headers);
    final res = await _client.send(req);
    if (_isCancelled) {
      _onCancelled();
      return null;
    }

    if (res.statusCode != 200) {
      throw Exception('Failed to download $uri: ${res.statusCode}');
    }

    final stream = res.stream.map((chunk) {
      if (_isCancelled) {
        throw StateError('Cancelled request');
      }
      return chunk;
    });

    try {
      final Uint8List bytes = await _downloadBytes(stream, res.contentLength ?? -1);
      if (_isCancelled) {
        return null;
      }
      return await ImmutableBuffer.fromUint8List(bytes);
    } catch (e) {
      if (_isCancelled) {
        return null;
      }
      rethrow;
    }
  }

  Future<Uint8List> _downloadBytes(Stream<List<int>> stream, int length) async {
    final Uint8List bytes;
    int offset = 0;
    if (length > 0) {
      // Known content length - use pre-allocated buffer
      bytes = Uint8List(length);
      await stream.listen((chunk) {
        bytes.setAll(offset, chunk);
        offset += chunk.length;
      }, cancelOnError: true).asFuture();
    } else {
      // Unknown content length - collect chunks dynamically
      final chunks = <List<int>>[];
      int totalLength = 0;
      await stream.listen((chunk) {
        chunks.add(chunk);
        totalLength += chunk.length;
      }, cancelOnError: true).asFuture();

      bytes = Uint8List(totalLength);
      for (final chunk in chunks) {
        bytes.setAll(offset, chunk);
        offset += chunk.length;
      }
    }

    return bytes;
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
    abortTrigger.complete();
  }
}
