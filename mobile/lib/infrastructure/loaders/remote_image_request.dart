part of 'image_request.dart';

class RemoteImageRequest extends ImageRequest {
  final String uri;
  final Map<String, String> headers;

  RemoteImageRequest({required this.uri, required this.headers});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    final Map<String, int> info = await remoteImageApi.requestImage(uri, headers: headers, requestId: requestId);

    try {
      final frame = await _fromPlatformImage(info, shouldFree: Platform.isIOS);
      return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
    } finally {
      if (Platform.isAndroid) {
        unawaited(remoteImageApi.releaseImage(requestId));
      }
    }
  }

  @override
  Future<void> _onCancelled() {
    return remoteImageApi.cancelRequest(requestId);
  }
}
