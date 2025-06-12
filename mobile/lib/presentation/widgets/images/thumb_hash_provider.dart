import 'dart:convert' hide Codec;
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/rendering.dart';
import 'package:thumbhash/thumbhash.dart';

class ThumbHashProvider extends ImageProvider<ThumbHashProvider> {
  final String thumbHash;

  ThumbHashProvider({
    required this.thumbHash,
  });

  @override
  Future<ThumbHashProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ThumbHashProvider key,
    ImageDecoderCallback decode,
  ) {
    return MultiFrameImageStreamCompleter(
      codec: _loadCodec(key, decode),
      scale: 1.0,
    );
  }

  Future<Codec> _loadCodec(
    ThumbHashProvider key,
    ImageDecoderCallback decode,
  ) async {
    final image = thumbHashToRGBA(base64Decode(key.thumbHash));
    return decode(await ImmutableBuffer.fromUint8List(rgbaToBmp(image)));
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is ThumbHashProvider) {
      return thumbHash == other.thumbHash;
    }
    return false;
  }

  @override
  int get hashCode => thumbHash.hashCode;
}
