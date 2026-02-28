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

    final info = await remoteImageApi.requestImage(uri, headers: headers, requestId: requestId, preferEncoded: false);
    // Android always returns encoded data, so we need to check for both shapes of the response.
    final frame = switch (info) {
      {'pointer': int pointer, 'length': int length} => await _fromEncodedPlatformImage(pointer, length),
      {'pointer': int pointer, 'width': int width, 'height': int height, 'rowBytes': int rowBytes} =>
        await _fromDecodedPlatformImage(pointer, width, height, rowBytes),
      _ => null,
    };
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  Future<ui.Codec?> loadCodec() async {
    if (_isCancelled) {
      return null;
    }

    final info = await remoteImageApi.requestImage(uri, headers: headers, requestId: requestId, preferEncoded: true);
    if (info == null) return null;

    final (codec, _) = await _codecFromEncodedPlatformImage(info['pointer']!, info['length']!) ?? (null, null);
    return codec;
  }

  @override
  Future<void> _onCancelled() {
    return remoteImageApi.cancelRequest(requestId);
  }
}
