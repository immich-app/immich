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

    Stopwatch? stopwatch;
    if (!kReleaseMode) {
      stopwatch = Stopwatch()..start();
    }
    final Map<String, int> info = await thumbnailApi.requestImage(
      localId,
      requestId: requestId,
      width: width,
      height: height,
      isVideo: assetType == AssetType.video,
    );
    if (!kReleaseMode) {
      stopwatch!.stop();
      debugPrint('Local request $requestId took ${stopwatch.elapsedMilliseconds}ms for $localId of $width x $height');
    }
    final frame = await _fromPlatformImage(info);
    return frame == null ? null : ImageInfo(image: frame.image, scale: scale);
  }

  @override
  Future<void> _onCancelled() {
    if (!kReleaseMode) {
      debugPrint('Local image request $requestId for $localId of size $width x $height was cancelled');
    }
    return thumbnailApi.cancelImageRequest(requestId);
  }
}
