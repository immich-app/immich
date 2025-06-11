import 'dart:convert' hide Codec;
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/rendering.dart';
import 'package:thumbhash/thumbhash.dart';

class ImThumbHashProvider extends ImageProvider<ImThumbHashProvider> {
  final String thumbHash;

  ImThumbHashProvider({
    required this.thumbHash,
  });

  @override
  Future<ImThumbHashProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImThumbHashProvider key,
    ImageDecoderCallback decode,
  ) {
    return MultiFrameImageStreamCompleter(
      codec: _loadCodec(key, decode),
      scale: 1.0,
    );
  }

  Future<Codec> _loadCodec(
    ImThumbHashProvider key,
    ImageDecoderCallback decode,
  ) async {
    final image = thumbHashToRGBA(base64Decode(key.thumbHash));
    return decode(await ImmutableBuffer.fromUint8List(rgbaToBmp(image)));
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is ImThumbHashProvider) {
      return thumbHash == other.thumbHash;
    }
    return false;
  }

  @override
  int get hashCode => thumbHash.hashCode;
}
