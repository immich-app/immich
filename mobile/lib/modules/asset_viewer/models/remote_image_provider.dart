import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

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
