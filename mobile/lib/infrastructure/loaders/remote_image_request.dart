part of 'image_request.dart';

/// Requests a remote image from the platform via HTTP.
///
/// The [encoded] flag controls the response format from the platform:
/// - `encoded: true` — returns raw encoded bytes as `{pointer, length}`,
///   used for animated images where a multi-frame codec is needed.
/// - `encoded: false` — on iOS, decodes the image to RGBA pixels and returns
///   `{pointer, width, height, rowBytes}`. On Android, the flag is ignored and
///   raw encoded bytes are always returned as `{pointer, length}`.
///
/// The [load] method handles both response shapes via pattern matching to
/// account for this platform difference.
class RemoteImageRequest extends ImageRequest {
  final String uri;
  final Map<String, String> headers;

  RemoteImageRequest({required this.uri, required this.headers});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    final info = await remoteImageApi.requestImage(uri, headers: headers, requestId: requestId, encoded: false);
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

    final info = await remoteImageApi.requestImage(uri, headers: headers, requestId: requestId, encoded: true);
    if (info == null || _isCancelled) {
      return null;
    }

    return switch (info) {
      {'pointer': int pointer, 'length': int length} => () async {
        final result = await _codecFromEncodedPlatformImage(pointer, length);
        if (result == null) return null;

        final (codec, descriptor) = result;
        descriptor.dispose();

        return codec;
      }(),
      _ => null,
    };
  }

  @override
  Future<void> _onCancelled() {
    return remoteImageApi.cancelRequest(requestId);
  }
}
