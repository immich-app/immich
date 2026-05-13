part of 'image_request.dart';

class ThumbhashImageRequest extends ImageRequest {
  final String thumbhash;

  ThumbhashImageRequest({required this.thumbhash});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    final Map<String, int> info = await localImageApi.getThumbhash(thumbhash);
    final frame = await _fromDecodedPlatformImage(info["pointer"]!, info["width"]!, info["height"]!, info["rowBytes"]!);
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  Future<ui.Codec?> loadCodec() => throw UnsupportedError('Thumbhash does not support codec loading');

  @override
  void _onCancelled() {}
}
