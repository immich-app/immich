import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:thumbhash/thumbhash.dart' as thumbhash;

ObjectRef<Uint8List?> useBlurHashRef(Asset? asset) {
  if (asset?.thumbhash == null) {
    return useRef(null);
  }

  final rbga = thumbhash.thumbHashToRGBA(
    base64Decode(asset!.thumbhash!),
  );

  return useRef(thumbhash.rgbaToBmp(rbga));
}

ObjectRef<Uint8List?> useDriftBlurHashRef(RemoteAsset? asset) {
  if (asset?.thumbHash == null) {
    return useRef(null);
  }

  final rbga = thumbhash.thumbHashToRGBA(
    base64Decode(asset!.thumbHash!),
  );

  return useRef(thumbhash.rgbaToBmp(rbga));
}
