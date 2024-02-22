import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:thumbhash/thumbhash.dart' as thumbhash;

ValueNotifier<Uint8List?> useBlurHashState(Asset? asset) {
  if (asset?.thumbhash == null) {
    return useState(null);
  }

  final rbga = thumbhash.thumbHashToRGBA(
    base64Decode(asset!.thumbhash!),
  );

  return useState(thumbhash.rgbaToBmp(rbga));
}
