import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:thumbhash/thumbhash.dart' as thumbhash;

class Thumbhash extends StatelessWidget {
  final String blurhash;
  final BoxFit fit;

  const Thumbhash({
    required this.blurhash,
    this.fit = BoxFit.cover,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Image.memory(
      thumbhash.rgbaToBmp(thumbhash.thumbHashToRGBA(base64.decode(blurhash))),
      fit: fit,
    );
  }
}
