part of 'image_request.dart';

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
      preferEncoded: false,
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

    // Go through the decoded path (not preferEncoded: true). Handing raw
    // HEIF/HEIC bytes to Flutter engine's `ImageDescriptor.encoded` triggers
    // `AndroidImageGenerator`, which calls Android `ImageDecoder.decodeBitmap`
    // under the assumption the result is ARGB_8888. For 10-bit HEIF (e.g.
    // Sony .HIF), Android returns `RGBA_F16` (8 bytes/pixel) and the engine's
    // `memcpy(pixels, data, w*h*4)` silently truncates the pixel data,
    // producing correctly shaped but garbled-colour output.
    //
    // `LocalImagesImpl.toNativeBuffer` on the Kotlin side normalises to
    // ARGB_8888 before crossing the Dart boundary, so the decoded path is
    // safe.
    final info = await localImageApi.requestImage(
      localId,
      requestId: requestId,
      width: width,
      height: height,
      isVideo: assetType == AssetType.video,
      preferEncoded: false,
    );
    if (info == null) return null;

    final result = await _codecFromDecodedPlatformImage(
      info['pointer']!,
      info['width']!,
      info['height']!,
      info['rowBytes']!,
    );
    if (result == null) return null;

    final (codec, descriptor) = result;
    descriptor.dispose();
    return codec;
  }

  @override
  Future<void> _onCancelled() {
    return localImageApi.cancelRequest(requestId);
  }
}
