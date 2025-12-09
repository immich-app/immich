import 'dart:async';
import 'dart:ffi';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ffi/ffi.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/image/cache/remote_image_cache_manager.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:logging/logging.dart';

part 'local_image_request.dart';
part 'thumbhash_image_request.dart';
part 'remote_image_request.dart';

abstract class ImageRequest {
  static int _nextRequestId = 0;

  final int requestId = _nextRequestId++;
  bool _isCancelled = false;

  get isCancelled => _isCancelled;

  ImageRequest();

  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0});

  void cancel() {
    if (_isCancelled) {
      return;
    }
    _isCancelled = true;
    return _onCancelled();
  }

  void _onCancelled();

  Future<ui.FrameInfo?> _fromPlatformImage(Map<String, int> info) async {
    final address = info['pointer'];
    if (address == null) {
      return null;
    }

    final pointer = Pointer<Uint8>.fromAddress(address);
    if (_isCancelled) {
      malloc.free(pointer);
      return null;
    }

    final int actualWidth;
    final int actualHeight;
    final int actualSize;
    final ui.ImmutableBuffer buffer;
    try {
      actualWidth = info['width']!;
      actualHeight = info['height']!;
      actualSize = actualWidth * actualHeight * 4;
      buffer = await ImmutableBuffer.fromUint8List(pointer.asTypedList(actualSize));
    } finally {
      malloc.free(pointer);
    }

    if (_isCancelled) {
      buffer.dispose();
      return null;
    }

    final descriptor = ui.ImageDescriptor.raw(
      buffer,
      width: actualWidth,
      height: actualHeight,
      pixelFormat: ui.PixelFormat.rgba8888,
    );
    final codec = await descriptor.instantiateCodec();
    if (_isCancelled) {
      buffer.dispose();
      descriptor.dispose();
      codec.dispose();
      return null;
    }

    return await codec.getNextFrame();
  }
}
