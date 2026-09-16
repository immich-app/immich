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

    final info = await RemoteImageFetchScheduler.instance.schedule(
      this,
      () => remoteImageApi.requestImage(
        uri,
        requestId: requestId,
        preferEncoded: false,
        width: decodeSize?.width.ceil(),
        height: decodeSize?.height.ceil(),
      ),
    );
    if (info == null) {
      return null;
    }
    // Android falls back to encoded data if native decoding fails, so check for both shapes of the response.
    final frame = switch (info) {
      {'pointer': final int pointer, 'length': final int length} => await _fromEncodedPlatformImage(
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

    final info = await RemoteImageFetchScheduler.instance.schedule(
      this,
      () => remoteImageApi.requestImage(uri, requestId: requestId, preferEncoded: true, width: null, height: null),
    );
    if (info == null) {
      return null;
    }

    final (codec, _) = await _codecFromEncodedPlatformImage(info['pointer']!, info['length']!) ?? (null, null);
    return codec;
  }

  @override
  void _onCancelled() {
    // Drops this request from our own queue if it hasn't been dispatched to
    // native code yet - cheap and safe, since no UrlRequest exists for it.
    //
    // Deliberately does NOT call the native cancelRequest for a request
    // that's already in flight anymore. Our own thumbhash decode path never
    // cancels in-flight native work at all (stale results are simply
    // discarded) and has never appeared in a crash report; this network
    // fetch path is the only one that actively cancels live native requests,
    // and it's the only one that crashes - worse specifically when reversing
    // scrub direction rapidly cancels a whole batch of in-flight requests at
    // once. Letting an in-flight fetch run to completion and discarding a
    // stale result (already handled by the isCancelled check in
    // CancellableImageProviderMixin) costs some wasted bandwidth/CPU, but
    // avoids touching Cronet's own cancellation path under heavy churn.
    RemoteImageFetchScheduler.instance.cancel(this);
  }
}
