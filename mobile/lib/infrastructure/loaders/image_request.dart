import 'dart:async';
import 'dart:ffi';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:ffi/ffi.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';

part 'local_image_request.dart';
part 'remote_image_request.dart';
part 'thumbhash_image_request.dart';

abstract class ImageRequest {
  static int _nextRequestId = 0;

  final int requestId = _nextRequestId++;
  bool _isCancelled = false;

  get isCancelled => _isCancelled;

  ImageRequest();

  Future<ImageInfo?> load(ImageDecoderCallback decode, {double scale = 1.0});

  Future<ui.Codec?> loadCodec();

  void cancel() {
    if (_isCancelled) {
      return;
    }
    _isCancelled = true;
    return _onCancelled();
  }

  void _onCancelled();

  Future<(ui.Codec, ui.ImageDescriptor)?> _codecFromEncodedPlatformImage(
    int address,
    int length, {
    ui.Size size = ui.Size.zero,
  }) async {
    final pointer = Pointer<Uint8>.fromAddress(address);
    if (_isCancelled) {
      malloc.free(pointer);
      return null;
    }

    final ui.ImmutableBuffer buffer;
    try {
      buffer = await ImmutableBuffer.fromUint8List(pointer.asTypedList(length));
    } finally {
      malloc.free(pointer);
    }

    if (_isCancelled) {
      buffer.dispose();
      return null;
    }

    final descriptor = await ui.ImageDescriptor.encoded(buffer);
    buffer.dispose();
    if (_isCancelled) {
      descriptor.dispose();
      return null;
    }

    final target = _targetSize(descriptor.width, descriptor.height, size);
    final codec = await descriptor.instantiateCodec(targetWidth: target?.$1, targetHeight: target?.$2);
    if (_isCancelled) {
      descriptor.dispose();
      codec.dispose();
      return null;
    }

    return (codec, descriptor);
  }

  Future<ui.FrameInfo?> _fromEncodedPlatformImage(int address, int length, {ui.Size size = ui.Size.zero}) async {
    final result = await _codecFromEncodedPlatformImage(address, length, size: size);
    if (result == null) {
      return null;
    }

    final (codec, descriptor) = result;
    if (_isCancelled) {
      descriptor.dispose();
      codec.dispose();
      return null;
    }

    final frame = await codec.getNextFrame();
    descriptor.dispose();
    codec.dispose();
    if (_isCancelled) {
      frame.image.dispose();
      return null;
    }

    return frame;
  }

  (int, int)? _targetSize(int width, int height, ui.Size size) {
    if (size.width <= 0 || size.height <= 0) {
      return null;
    }

    final fillScale = math.max(size.width / width, size.height / height);
    final scale = math.min(1.0, fillScale);
    if (scale >= 1) {
      return null;
    }

    return ((width * scale).ceil(), (height * scale).ceil());
  }

  Future<ui.FrameInfo?> _fromDecodedPlatformImage(int address, int width, int height, int rowBytes) async {
    final pointer = Pointer<Uint8>.fromAddress(address);
    if (_isCancelled) {
      malloc.free(pointer);
      return null;
    }

    final size = rowBytes * height;
    final ui.ImmutableBuffer buffer;
    try {
      buffer = await ImmutableBuffer.fromUint8List(pointer.asTypedList(size));
    } finally {
      malloc.free(pointer);
    }

    if (_isCancelled) {
      buffer.dispose();
      return null;
    }

    final descriptor = ui.ImageDescriptor.raw(
      buffer,
      width: width,
      height: height,
      rowBytes: rowBytes,
      pixelFormat: ui.PixelFormat.rgba8888,
    );
    buffer.dispose();

    final codec = await descriptor.instantiateCodec();
    if (_isCancelled) {
      descriptor.dispose();
      codec.dispose();
      return null;
    }

    final frame = await codec.getNextFrame();
    descriptor.dispose();
    codec.dispose();
    if (_isCancelled) {
      frame.image.dispose();
      return null;
    }

    return frame;
  }
}
