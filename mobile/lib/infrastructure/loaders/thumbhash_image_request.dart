part of 'image_request.dart';

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
      debugPrint('Thumbhash request $requestId took ${stopwatch.elapsedMilliseconds}ms');
    }
    final frame = await _fromPlatformImage(info);
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  void _onCancelled() {
    if (!kReleaseMode) {
      debugPrint('Thumbhash request $requestId for $thumbhash was cancelled');
    }
  }
}
