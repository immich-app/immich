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
    );
    if (info == null) {
      return null;
    }

    final frame = await _fromDecodedPlatformImage(info["pointer"]!, info["width"]!, info["height"]!, info["rowBytes"]!);
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  Future<ui.Codec?> loadCodec() async {
    if (_isCancelled) {
      return null;
    }

    final entity = await AssetEntity.fromId(localId);
    if (entity == null || _isCancelled) {
      return null;
    }

    final file = await entity.originFile;
    if (file == null || _isCancelled) {
      return null;
    }

    final buffer = await ui.ImmutableBuffer.fromFilePath(file.path);
    if (_isCancelled) {
      buffer.dispose();
      return null;
    }

    final descriptor = await ui.ImageDescriptor.encoded(buffer);
    buffer.dispose();
    if (_isCancelled) {
      descriptor.dispose();
      return null;
    }

    final codec = await descriptor.instantiateCodec();
    descriptor.dispose();
    if (_isCancelled) {
      codec.dispose();
      return null;
    }

    return codec;
  }

  @override
  Future<void> _onCancelled() {
    return localImageApi.cancelRequest(requestId);
  }
}
