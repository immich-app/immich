import 'dart:ui';

import 'package:flutter/painting.dart';

extension CodecImageInfoExtension on Codec {
  Future<ImageInfo> getImageInfo({double scale = 1.0}) async {
    final frame = await getNextFrame();
    return ImageInfo(image: frame.image, scale: scale);
  }
}
