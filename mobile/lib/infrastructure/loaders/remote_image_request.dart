part of 'image_request.dart';

class RemoteImageRequest extends ImageRequest {
  final String uri;

  RemoteImageRequest({required this.uri});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    final info = await remoteImageApi.requestImage(uri, requestId: requestId);
    final frame = switch (info) {
      {'pointer': int pointer, 'length': int length} => await _fromEncodedPlatformImage(pointer, length),
      {'pointer': int pointer, 'width': int width, 'height': int height, 'rowBytes': int rowBytes} =>
        await _fromDecodedPlatformImage(pointer, width, height, rowBytes),
      _ => null,
    };
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  Future<void> _onCancelled() {
    return remoteImageApi.cancelRequest(requestId);
  }
}
