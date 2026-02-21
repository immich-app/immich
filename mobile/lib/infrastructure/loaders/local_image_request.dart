part of 'image_request.dart';

/// Requests a local image from the platform.
///
/// The [encoded] flag controls the response format from the platform:
/// - `encoded: true` — returns raw encoded bytes as `{pointer, length}`,
///   used for animated images where a multi-frame codec is needed.
/// - `encoded: false` — decodes the image to RGBA pixels and returns
///   `{pointer, width, height, rowBytes}` for direct display.
///
/// Both iOS and Android respect the [encoded] flag for local images.
class LocalImageRequest extends ImageRequest {
  final String localId;
  final int width;
  final int height;
  final AssetType assetType;

  LocalImageRequest({required this.localId, required ui.Size size, required this.assetType})
    : width = size.width.toInt(),
      height = size.height.toInt();

  @override
  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0}) async {
    if (_isCancelled) {
      return null;
    }

    final info = await localImageApi.requestImage(
      localId,
      requestId: requestId,
      width: width,
      height: height,
      isVideo: assetType == AssetType.video,
      encoded: false,
    );
    if (info == null) {
      return null;
    }

    final frame = await _fromDecodedPlatformImage(info["pointer"]!, info["width"]!, info["height"]!, info["rowBytes"]!);
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  Future<ui.Codec?> loadCodec() async {
    if (_isCancelled) {
      return null;
    }

    final info = await localImageApi.requestImage(
      localId,
      requestId: requestId,
      width: width,
      height: height,
      isVideo: assetType == AssetType.video,
      encoded: true,
    );
    if (info == null || _isCancelled) {
      return null;
    }

    return switch (info) {
      {'pointer': int pointer, 'length': int length} => () async {
        final result = await _codecFromEncodedPlatformImage(pointer, length);
        if (result == null) {
          return null;
        }

        final (codec, descriptor) = result;
        descriptor.dispose();

        return codec;
      }(),
      _ => null,
    };
  }

  @override
  Future<void> _onCancelled() {
    return localImageApi.cancelRequest(requestId);
  }
}
