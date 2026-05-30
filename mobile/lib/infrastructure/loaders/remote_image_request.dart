part of 'image_request.dart';

class RemoteImageRequest extends ImageRequest {
  final String uri;

  /// When set, the server thumbnail is downscaled to this edge (px) on decode so
  /// tiny grid tiles use proportionally small textures. Null = full resolution.
  final int? decodeEdge;

  RemoteImageRequest({required this.uri, this.decodeEdge});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    final info = await remoteImageApi.requestImage(uri, requestId: requestId, preferEncoded: false);
    // Android always returns encoded data, so we need to check for both shapes of the response.
    final frame = switch (info) {
      // Bound width only; instantiateCodec scales height proportionally, so the
      // thumbnail keeps its aspect ratio (cover-cropped to the square tile).
      {'pointer': int pointer, 'length': int length} => await _fromEncodedPlatformImage(
        pointer,
        length,
        targetWidth: decodeEdge,
      ),
      {'pointer': int pointer, 'width': int width, 'height': int height, 'rowBytes': int rowBytes} =>
        await _fromDecodedPlatformImage(pointer, width, height, rowBytes, targetWidth: decodeEdge),
      _ => null,
    };
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  Future<ui.Codec?> loadCodec() async {
    if (_isCancelled) {
      return null;
    }

    final info = await remoteImageApi.requestImage(uri, requestId: requestId, preferEncoded: true);
    if (info == null) {
      return null;
    }

    final (codec, _) = await _codecFromEncodedPlatformImage(info['pointer']!, info['length']!) ?? (null, null);
    return codec;
  }

  @override
  Future<void> _onCancelled() {
    return remoteImageApi.cancelRequest(requestId);
  }
}
