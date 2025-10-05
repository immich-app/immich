part of 'image_request.dart';

class ThumbhashImageRequest extends ImageRequest {
  final String thumbhash;

  ThumbhashImageRequest({required this.thumbhash});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    final Map<String, int> info = await thumbnailApi.getThumbhash(thumbhash);
    final frame = await _fromPlatformImage(info);
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  void _onCancelled() {}
}
