import 'dart:convert';
import 'dart:ffi';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_native_core/immich_native_core.dart';

ObjectRef<Uint8List?> useDriftBlurHashRef(RemoteAsset? asset) {
  return useRef(decodeDriftThumbHash(asset?.thumbHash));
}

Uint8List? decodeDriftThumbHash(String? thumbHash) {
  if (thumbHash == null || thumbHash.isEmpty) {
    return null;
  }

  final Uint8List hash;
  try {
    hash = base64Decode(thumbHash);
  } on FormatException {
    return null;
  }

  final hashPtr = malloc<Uint8>(hash.length);
  final info = malloc<Uint32>(3);
  try {
    hashPtr.asTypedList(hash.length).setAll(0, hash);
    final rgba = immich_core_thumbhash_decode(hashPtr, hash.length, info);
    if (rgba == nullptr) {
      return null;
    }

    try {
      return _rgbaToBmp(rgba, info[0], info[1], info[2]);
    } finally {
      malloc.free(rgba);
    }
  } finally {
    malloc.free(hashPtr);
    malloc.free(info);
  }
}

Uint8List? _rgbaToBmp(Pointer<Uint8> rgba, int width, int height, int stride) {
  if (width <= 0 || width > 32 || height <= 0 || height > 32 || stride != width * 4) {
    return null;
  }

  const headerSize = 54;
  final imageSize = stride * height;
  final data = ByteData(headerSize + imageSize);

  data
    ..setUint16(0, 0x4d42, Endian.little)
    ..setUint32(2, data.lengthInBytes, Endian.little)
    ..setUint32(10, headerSize, Endian.little)
    ..setUint32(14, 40, Endian.little)
    ..setInt32(18, width, Endian.little)
    ..setInt32(22, -height, Endian.little)
    ..setUint16(26, 1, Endian.little)
    ..setUint16(28, 32, Endian.little)
    ..setUint32(34, imageSize, Endian.little);

  final pixels = rgba.asTypedList(imageSize);
  for (var src = 0, dst = headerSize; src < imageSize; src += 4, dst += 4) {
    data
      ..setUint8(dst, pixels[src + 2])
      ..setUint8(dst + 1, pixels[src + 1])
      ..setUint8(dst + 2, pixels[src])
      ..setUint8(dst + 3, pixels[src + 3]);
  }

  return data.buffer.asUint8List();
}
