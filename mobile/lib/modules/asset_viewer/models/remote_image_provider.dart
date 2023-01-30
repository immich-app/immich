import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

/// Credit: [nillouise](https://stackoverflow.com/questions/63952779/how-to-build-a-custom-image-provider-in-flutter)
class RemoteImageProvider extends ImageProvider<RemoteImageProvider> {
  @override
  ImageStreamCompleter loadBuffer(RemoteImageProvider key, DecoderBufferCallback decode) {
    return super.loadBuffer(key, decode);
  }

  @override
  Future<RemoteImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture<RemoteImageProvider>(this);
  }
}
