part of 'image_request.dart';

class RemoteImageRequest extends ImageRequest {
  final String uri;

  /// Physical size to decode, or null for the source size.
  final ui.Size? decodeSize;

  RemoteImageRequest({required this.uri, this.decodeSize});

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    final info = await remoteImageApi.requestImage(
      uri,
      requestId: requestId,
      preferEncoded: false,
      width: decodeSize?.width.ceil(),
      height: decodeSize?.height.ceil(),
    );
    final frame = await _firstFrame(await _codecFromResponse(info, decodeSize: decodeSize));
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  Future<ui.Codec?> loadCodec() async {
    if (_isCancelled) {
      return null;
    }

    final info = await remoteImageApi.requestImage(
      uri,
      requestId: requestId,
      preferEncoded: true,
      width: null,
      height: null,
    );
    final result = await _codecFromResponse(info);
    return result?.$1;
  }

  // Android falls back to encoded data if native decoding fails, and JPEG XL arrives decoded even when the encoded image
  // is requested, so check for both shapes of the response.
  Future<(ui.Codec, ui.ImageDescriptor)?> _codecFromResponse(Map<String, int>? info, {ui.Size? decodeSize}) =>
      switch (info) {
        {'pointer': final int pointer, 'length': final int length} => _codecFromEncodedPlatformImage(
          pointer,
          length,
          decodeSize: decodeSize,
        ),
        {
          'pointer': final int pointer,
          'width': final int width,
          'height': final int height,
          'rowBytes': final int rowBytes,
        } =>
          _codecFromDecodedPlatformImage(pointer, width, height, rowBytes),
        _ => Future.value(),
      };

  @override
  Future<void> _onCancelled() {
    return remoteImageApi.cancelRequest(requestId);
  }
}
