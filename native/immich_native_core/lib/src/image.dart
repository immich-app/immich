import 'dart:ffi';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';

import 'ffi/bindings.g.dart' as bindings;

/// True if [orientation] (EXIF) swaps width and height (the 90/270/transpose family).
bool orientationSwapsDims(int orientation) =>
    orientation == 5 || orientation == 6 || orientation == 7 || orientation == 8;

/// Rotate an RGBA8888 image to the given EXIF [orientation], returning a freshly
/// packed buffer (dims swap for 90/270/transpose). [srcStride] is bytes per source
/// row (>= width*4). Returns null if the native rotate declines (bad sizes).
///
/// The production caller is the platform decode pipeline (it has the locked native
/// bitmap); this Dart entry mirrors that path and is what the host tests exercise.
Uint8List? rotateRgba8888(Uint8List src, int srcStride, int width, int height, int orientation) {
  final dw = orientationSwapsDims(orientation) ? height : width;
  final dh = orientationSwapsDims(orientation) ? width : height;
  final dstLen = dw * dh * 4;
  final srcPtr = malloc<Uint8>(src.isEmpty ? 1 : src.length);
  final dstPtr = malloc<Uint8>(dstLen == 0 ? 1 : dstLen);
  try {
    if (src.isNotEmpty) srcPtr.asTypedList(src.length).setAll(0, src);
    final ok = bindings.immich_core_rotate_rgba8888(
      srcPtr.cast(),
      src.length,
      srcStride,
      width,
      height,
      orientation,
      dstPtr.cast(),
      dstLen,
    );
    if (!ok) return null;
    return Uint8List.fromList(dstPtr.asTypedList(dstLen));
  } finally {
    malloc.free(srcPtr);
    malloc.free(dstPtr);
  }
}
