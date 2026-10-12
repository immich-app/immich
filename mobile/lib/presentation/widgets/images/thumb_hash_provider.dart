import 'package:flutter/foundation.dart';
import 'package:flutter/rendering.dart';
import 'package:immich_mobile/infrastructure/loaders/image_request.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';

class ThumbHashProvider extends ImageProvider<ThumbHashProvider> {
  final String thumbHash;

  const ThumbHashProvider({required this.thumbHash});

  @override
  Future<ThumbHashProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(ThumbHashProvider key, ImageDecoderCallback decode) {
    final loader = ImageLoader(key);
    return OneFramePlaceholderImageStreamCompleter(
      _loadCodec(loader, key, decode),
      onLastListenerRemoved: loader.cancel,
    );
  }

  Stream<ImageInfo> _loadCodec(ImageLoader loader, ThumbHashProvider key, ImageDecoderCallback decode) {
    final request = loader.request = ThumbhashImageRequest(thumbhash: key.thumbHash);
    return loader.loadRequest(request, decode, isFinal: true);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    if (other is ThumbHashProvider) {
      return thumbHash == other.thumbHash;
    }
    return false;
  }

  @override
  int get hashCode => thumbHash.hashCode;
}
